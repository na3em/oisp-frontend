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
var config = require('../../config'),
    redis = require("redis"),
    logger = require('../../lib/logger').init(),
    client;

exports.redisClient = function () {
    if(client){
        return client;
    }
    if (config.redis.port) {
        client = redis.createClient(config.redis.port, config.redis.host, {});
        client.auth(config.redis.password);

    } else {
        client = redis.createClient();
    }

    client.on("error", function (err) {
        logger.error("Redis client error " + err);
        throw(err);
    });

    return client;
};