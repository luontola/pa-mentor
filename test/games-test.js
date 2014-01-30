// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var Q = require('q');
var assert = require('assert');
var db = require('../server/db');
var gamesDao = require('../server/games');

function assertCount(expectedCount, collection, done) {
    collection.count().done(function (actualCount) {
        assert.equal(expectedCount, actualCount);
        done();
    });
}

describe('Games:', function () {

    beforeEach(function (done) {
        db.removeAll().fin(done);
    });

    it('Saves a game to database', function (done) {
        gamesDao.save({gameId: 10})
            .done(function () {
                assertCount(1, db.games, done);
            });
    });

    it('Saves multiple games to database', function (done) {
        gamesDao.save({gameId: 10})
            .then(function () {
                return gamesDao.save({gameId: 20})
            })
            .done(function () {
                assertCount(2, db.games, done);
            });
    });

    describe('Saving the same game multiple times:', function () {

        beforeEach(function (done) {
            gamesDao.save({gameId: 10, someField: "first version"})
                .then(function () {
                    return gamesDao.save({gameId: 10, someField: "second version"})
                })
                .fin(done);
        });

        it('Saves only one copy', function (done) {
            assertCount(1, db.games, done);
        });

        it('Updates the persisted entity', function (done) {
            gamesDao.findById(10).done(function (game) {
                assert.equal("second version", game.someField);
                done();
            });
        });
    });

    describe("Validating a game's schema:", function () {
        var game;
        beforeEach(function () {
            game = {
                "gameId": 11919,
                "teams": [
                    {
                        "teamId": 0,
                        "players": [
                            { "playerId": 3866, "playerName": "[RLM] beire" }
                        ]
                    }
                ],
                "winner": 2,
                "startTime": 1387745093622,
                "playerTimeData": {
                    "3866": [
                        {"timepoint": 1387745098815, "armyCount": 1, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": 10, "energyIncomeNet": 1000, "metalSpending": 0, "energySpending": 0, "metalStored": 800, "energyStored": 12000, "metalProduced": 49, "energyProduced": 4863, "metalWasted": 49, "energyWasted": 4863, "apm": 5}
                    ]
                },
                "playerInfo": {
                    "3866": {"name": "[RLM] beire", "color": "rgb(142,107,68)"}
                }
            };
        });

        function assertNotValid(game) {
            assert.throws(function () {
                gamesDao.validate(game);
            }, Error);
        }

        it("Valid games pass the check", function () {
            gamesDao.validate(game);
        });

        it("gameId is required", function () {
            game.gameId = "junk";
            assertNotValid(game);

            delete game.gameId;
            assertNotValid(game);
        });

        it("startTime is required", function () {
            game.startTime = "junk";
            assertNotValid(game);

            delete game.startTime;
            assertNotValid(game);
        });

        it("teams is required", function () {
            game.teams = "junk";
            assertNotValid(game);

            delete game.teams;
            assertNotValid(game);
        });

        it("teams[*].players[*].playerId is required", function () {
            game.teams[0].players[0].playerId = "junk";
            assertNotValid(game);

            delete game.teams[0].players[0].playerId;
            assertNotValid(game);
        });

        it("playerTimeData is required", function () {
            game.playerTimeData = "junk";
            assertNotValid(game);

            delete game.playerTimeData;
            assertNotValid(game);
        });

        it("playerTimeData.*[*].timepoint is required", function () {
            game.playerTimeData['3866'][0].timepoint = "junk";
            assertNotValid(game);

            delete game.playerTimeData['3866'][0].timepoint;
            assertNotValid(game);
        });

        it("playerTimeData.*[*].* are numerical stats", function () {
            game.playerTimeData['3866'][0].someStat = "junk";
            assertNotValid(game);
        });
    });

    describe('Removing old games:', function () {

        beforeEach(function (done) {
            Q.all([
                    gamesDao.save({gameId: 10, startTime: 100}),
                    gamesDao.save({gameId: 20, startTime: 200})
                ])
                .then(function () {
                    return gamesDao.removeGamesStartedBefore(150);
                })
                .fin(done).done()
        });

        it('Removes older games', function (done) {
            gamesDao.findById(10)
                .then(function (game) {
                    assert.ok(game === null, "did not remove the old game");
                })
                .fin(done).done();
        });

        it('Keeps newer games', function (done) {
            gamesDao.findById(20)
                .then(function (game) {
                    assert.ok(game, "did not keep the new game");
                })
                .fin(done).done();
        });
    });

    it('Finds the newest starting time', function (done) {
        Q.all([
                gamesDao.save({gameId: 10, startTime: 100}),
                gamesDao.save({gameId: 20, startTime: 200})
            ])
            .then(function () {
                return gamesDao.getNewestStartTime();
            })
            .then(function (startTime) {
                assert.equal(startTime, 200);
            })
            .fin(done).done();
    });

    it('Newest starting time is 0 when there are no games', function (done) {
        gamesDao.getNewestStartTime()
            .then(function (startTime) {
                assert.equal(startTime, 0);
            })
            .fin(done).done();
    });
});
