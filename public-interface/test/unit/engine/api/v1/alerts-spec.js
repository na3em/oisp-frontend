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
var expect = require('expect.js'),
    sinon = require('sinon'),
    rewire = require('rewire'),
    alertsManager = rewire('../../../../../engine/api/v1/alerts');

describe('alerts api', function(){
    var domain = {
            id: Math.random()
        },
        alert = {
            id: Math.random()
        };

    describe('add comments', function(){
        it('should add comments to given alert', function(done){
            // prepare
            var comments = [
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    },
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    }
                ],
                existingAlert = {
                    id: alert.id
                },
                dbMock = {
                    findByExternalId: sinon.stub().callsArgWith(2, null, existingAlert),
                    addComments: sinon.stub().callsArgWith(1, null)
                },
                callback = sinon.spy();

            alertsManager.__set__('Alert', dbMock);

            // execute
            alertsManager.addComments({domainId: domain.id, alertId: alert.id, comments: comments}, callback);

            // attest
            expect(callback.calledOnce).to.equal(true);
            expect(callback.args[0].length).to.equal(0);

            expect(dbMock.findByExternalId.calledOnce).to.equal(true);
            expect(dbMock.addComments.calledOnce).to.equal(true);

            done();
        });

        it('should call callback with 8502 error if there is an error when saving comments', function(done){
            // prepare
            var comments = [
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    },
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    }
                ],
                exisintAlert = {
                    id: alert.id
                },
                dbMock = {
                    findByExternalId: sinon.stub().callsArgWith(2, null, exisintAlert),
                    addComments: sinon.stub().callsArgWith(1, new Error(500))
                },
                callback = sinon.spy();

            alertsManager.__set__('Alert', dbMock);

            // execute
            alertsManager.addComments({domainId: domain.id, alertId: alert.id, comments: comments}, callback);

            // attest
            expect(callback.calledOnce).to.equal(true);
            expect(callback.args[0].length).to.equal(1);
            expect(callback.args[0][0].code).to.equal(8502);

            expect(dbMock.findByExternalId.calledOnce).to.equal(true);
            expect(dbMock.addComments.calledOnce).to.equal(true);

            done();
        });

        it('should call callback with 8404 error if there is an error when saving comments', function(done){
            // prepare
            var comments = [
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    },
                    {
                        user: 'user1@test.com',
                        timestamp: Date.now(),
                        text: 'comment1'
                    }
                ],
                dbMock = {
                    findByExternalId: sinon.stub().callsArgWith(2, new Error(404)),
                    addComments: sinon.spy()
                },
                callback = sinon.spy();

            alertsManager.__set__('Alert', dbMock);

            // execute
            alertsManager.addComments({domainId: domain.id, alertId: alert.id, comments: comments}, callback);

            // attest
            expect(callback.calledOnce).to.equal(true);
            expect(callback.args[0].length).to.equal(1);
            expect(callback.args[0][0].code).to.equal(8404);

            expect(dbMock.findByExternalId.calledOnce).to.equal(true);
            expect(dbMock.addComments.calledOnce).to.equal(false);

            done();
        });
    });
});