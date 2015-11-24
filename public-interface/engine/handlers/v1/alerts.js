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

'use strict';

var alert = require('../../api/v1/alerts'),
    httpStatuses = require('../../res/httpStatuses'),
    errors  = require('../../../lib/errorHandler/index').errBuilder.Errors,
    logger = require('../../../lib/logger/index').init();

exports.usage = function(req, res){
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.status(httpStatuses.OK.code).send();
};

exports.trigger = function (req, res, next) {
    var data = req.body.data;
    logger.log('Alert Message from Client: ' + JSON.stringify(data) );
    alert.trigger(data, req.params.accountId, req.forwardedHeaders.baseUrl, function(err, result){
        if(!err){
            var returnCode = httpStatuses.OK.code;
            if (result.some(function(res){ return res.err; })) {
                returnCode = errors.Generic.InvalidRequest.code;
            }
            res.status(returnCode).send(result);
        } else {
            next(err);
        }
    });
};

exports.reset = function (req, res, next) {
    var params = {accountId: req.params.accountId, alertId: req.params.alertId};
    alert.reset(params, function(err){
        if(!err){
            res.status(httpStatuses.OK.code).send();
        } else {
            next(err);
        }
    });
};

exports.changeStatus = function (req, res, next) {
    var params = {accountId: req.params.accountId, alertId: req.params.alertId, status: req.params.status};
    alert.changeStatus(params, function(err){
        if(!err){
            res.status(httpStatuses.OK.code).send();
        } else {
            next(err);
        }
    });
};

exports.bulkReset = function (req, res, next) {

    var params =     req.body.data;
    logger.log('Reset Message from Client: ' + JSON.stringify(params) );
    alert.bulkReset(params, function(err, result){
        if(!err){
            var returnCode = httpStatuses.OK.code;
            if (result.some(function(res){ return res.err; })) {
                returnCode = errors.Generic.InvalidRequest.code;
            }
            res.status(returnCode).send(result);
        } else {
            next(err);
        }
    });
};

exports.getAlerts = function(req, res, next) {
    var params = {accountId: req.params.accountId};
    if (req.query.status) {
        params.status = req.query.status.split(",");
    }

    alert.getAlerts(params, function(err, result){
        if(!err && result){
            res.status(httpStatuses.OK.code).send(result);
        } else {
            next(err);
        }
    });
};

exports.getAlert = function(req, res, next) {
    var params = {accountId: req.params.accountId, alertId: req.params.alertId};
    alert.getAlert(params, function(err, alert){
        if(!err){
            res.status(httpStatuses.OK.code).send(alert);
        } else {
            next(err);
        }
    });
};

exports.addComments = function(req, res, next) {
    var options = {
        accountId: req.params.accountId,
        alertId: req.params.alertId,
        comments: req.body
    };

    alert.addComments(options, function(err){
        if(!err){
            res.status(httpStatuses.OK.code).send();
        } else {
            next(err);
        }
    });
};
