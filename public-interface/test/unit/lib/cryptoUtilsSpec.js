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

var expect = require('expect.js'),
    sinon = require('sinon'),
    cryptoUtil = require('../../../lib/cryptoUtils');

describe("Crypto Utils tests", function(){

    describe("#cryptoUtils", function() {

        it('Should hash and verify a password', function(done){
            var password = cryptoUtil.generate(50);
            var hashedPassword = cryptoUtil.hash(password);
            cryptoUtil.verify(password, hashedPassword.password, hashedPassword.salt, function(result){
                expect(result).to.be.equal(true);
                done();
            });
        });

        it('Should hash and not verify a password', function(done){
            var password = cryptoUtil.generate(50);
            var wrongPassword = cryptoUtil.generate(50);
            var hashedPassword = cryptoUtil.hash(password);
            cryptoUtil.verify(wrongPassword, hashedPassword.password, hashedPassword.salt, function(result){
                expect(result).to.be.equal(false);
                done();
            });
        });
    });
});