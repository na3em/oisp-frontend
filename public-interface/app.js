/**
 * Copyright (c) 2014 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";
var http = require('http'),
    express = require('./lib/express-jaeger').express,
    uuid = require('node-uuid'),
    AlertMonitor = require('./lib/event-monitor'),
    commServer = require('./lib/comm-server'),
    IotWsAuth = require('./lib/comm-server/plugins/iot-ws-auth'),
    iotRoutes =  require('./engine/routes'),
    uiRoutes = require('./dashboard/routes/ui.v1'),
    favicon = require('serve-favicon'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    config = require('./config'),
    secConfig = require('./lib/security/config'),
    winstonLogger = require('./lib/logger/winstonLogger'),
    security = require('./lib/security'),
    errors = require('./engine/res/errors'),
    errorHandler = require('./lib/errorHandler'),
    nodeErrorHandler = require('errorhandler'),
    httpHeadersInjector = require('./lib/http-headers-injector'),
    contextProvider = require('./lib/context-provider'),
    google = require('./lib/google'),
    models = require('./iot-entities/postgresql/models'),
    forceSSL = require('express-force-ssl'),
    heartBeat = require('./lib/heartbeat'),
    tracer = require('./lib/express-jaeger').tracer,
    grafana = require("./grafana"),
    cbor = require("./lib/cbor"),
    keycloak = require('./lib/security/keycloak');

var XSS = iotRoutes.cors,
    appServer = express(),
    httpServer = http.Server(appServer),
    monitor = new AlertMonitor(),
    api_port = config.api.port || 4001,
    maxSockets = config.api.socket || 1024,
    ENV = process.env.NODE_ENV || 'PRD';

function gracefulShutdown() {
    models.sequelize.close();
    tracer.close();
    heartBeat.stop();
    process.exit(1);
}

process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: ', err.message);
    console.log('Stack: ', err.stack);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled rejection at: ', promise);
    console.log('Reason: ', reason);
    gracefulShutdown();
});

/* We set the global agent to 1024 this is for
 how many concurrent sockets the agent can have open per origin
 */

http.globalAgent.maxSockets = maxSockets;

security.rateLimiter.init(secConfig);

appServer.set('env', ENV);
appServer.set('port', api_port);
appServer.disable('x-powered-by');
appServer.enable('trust proxy');
appServer.use(favicon(__dirname + '/dashboard/public/favicon.png'));
appServer.use(contextProvider.middleware);
appServer.startTracing();
appServer.use(compress());
if (config.api.forceSSL) {
    appServer.use(forceSSL);
} else {
    forceSSL = false;
}
appServer.use('/ui/public', express.static('dashboard/public'));

appServer.use(httpHeadersInjector.forwardedHeaders);
appServer.use(bodyParser.raw({limit: config.api.bodySizeLimit, type: "application/cbor"}));
appServer.use(cbor.parseCborBody);
appServer.use(bodyParser.json({limit: config.api.bodySizeLimit, type: "application/json"}));
appServer.use(bodyParser.urlencoded({extended: true, limit: config.api.bodySizeLimit}));
appServer.use(XSS());

appServer.use(winstonLogger.httpLogger());
appServer.use(keycloak.adapter.middleware());

(function setAppServerUseSecurityAndCaptcha(){
    var endpoints = ['/v1','/ui'];
    for(var i in endpoints){
        appServer.use(endpoints[i], security.authorization.middleware(secConfig, forceSSL));
        appServer.use(endpoints[i], security.authentication(config.auth, forceSSL));
        appServer.use(endpoints[i], security.rateLimiter.limit);
        appServer.use(endpoints[i], google.getCaptchaPublicKey());
    }
})();

if (process.env.NODE_ENV && (process.env.NODE_ENV.toLowerCase().indexOf("local") !== -1)) {
    appServer.use('/ui', function (req, res, next) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    });
}

appServer.use('/v1', function setUUID (req, res, next) {
    req.headers['x-iotkit-requestid'] = 'api:' + uuid.v4();
    contextProvider.instance().set('requestid', req.headers['x-iotkit-requestid']);
    next();
});

keycloak.registerEnforcer(appServer, keycloak.adapter);

/* Modules that registered his routes
 shall be unique or will be override
 */
uiRoutes.register(appServer);
/* Register all routes  */
iotRoutes.register(appServer);

appServer.use(errorHandler.middleware(errors));
if (appServer.get("env") === 'local') {
    appServer.use(nodeErrorHandler({ dumpExceptions:true, showStack:true }));
}

grafana.reverseProxyDataSource.listen(config.grafana.dataSourceProxyPort, () => {
    console.log('Data Source Reverse Proxy listening on port ' + config.grafana.dataSourceProxyPort);
});

grafana.reverseProxyGrafana.listen(config.grafana.proxyPort, () => {
    console.log('Grafana Reverse Proxy listening on port ' + config.grafana.proxyPort);
});

keycloak.keycloakListener.listen(config.auth.keycloak.keycloakListenerPort, () => {
    console.log('Keycloak Listener listening on port ' + config.auth.keycloak.keycloakListenerPort);
});

monitor.start();
commServer.init(httpServer, IotWsAuth);

models.sequelize.authenticate().then(function() {
    console.log("Connected to " + config.postgres.database + " db in postgresql on: " + JSON.stringify(config.postgres.options));
    grafana.getViewerToken()
        .then(() => {
            if (!module.parent) {
                httpServer.listen(api_port, function () {
                    console.log("Server Listen at Port: " + api_port + " in ENV : " + ENV);
                    heartBeat.start();
                });
            } else {
                module.exports.server = appServer;
            }
        });
});
