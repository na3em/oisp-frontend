/**
 * Copyright (c) 2019 Intel Corporation
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
const Keycloak = require('keycloak-connect'),
    keycloakListener = require('./listener'),
    KeycloakServiceAccount = require('./service-account'),
    getCustomGrants = require('./custom-grants'),
    registerEnforcer = require('./enforcer').register,
    authConfig = require('./../../../config').auth,
    config = require('./config').getKeycloakConfig();

const keycloakAdapter = new Keycloak({}, config),
    serviceAdapter = new Keycloak({}, config),
    serviceAccount = new KeycloakServiceAccount(serviceAdapter),
    customGrants = getCustomGrants(keycloakAdapter.grantManager.clientId,
        keycloakAdapter.grantManager.secret, keycloakAdapter.grantManager.realmUrl,
        keycloakAdapter.grantManager.public);

module.exports = {
    keycloakListener: keycloakListener,
    serviceAccount: serviceAccount,
    adapter: keycloakAdapter,
    customGrants: customGrants,
    placeholder: 'placeholder',
    placeholdermail: authConfig.placeholderUser,
    registerEnforcer: registerEnforcer,
    config: config
};
