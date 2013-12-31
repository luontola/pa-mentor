// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var db = require('../server/db');
var games = require('../server/games');
var analytics = require('../server/analytics');

function assertCount(expectedCount, collection, done) {
    collection.count(function (err, actualCount) {
        assert.equal(null, err);
        assert.equal(expectedCount, actualCount);
        done();
    });
}

describe('Games:', function () {
    beforeEach(function (done) {
        db.removeAll().fin(done);
    });

    it('Saves a game to database', function (done) {
        games.save({gameId: 10})
            .done(function () {
                assertCount(1, db.games, done);
            });
    });
    it('Saves multiple games to database', function (done) {
        games.save({gameId: 10})
            .then(function () {
                return games.save({gameId: 20})
            })
            .done(function () {
                assertCount(2, db.games, done);
            });
    });
    describe('Saving the same game multiple times', function () {
        beforeEach(function (done) {
            games.save({gameId: 10, someField: "first version"})
                .then(function () {
                    return games.save({gameId: 10, someField: "second version"})
                })
                .fin(done);
        });
        it('Saves only one copy', function (done) {
            assertCount(1, db.games, done);
        });
        it('Updates the persisted entity', function (done) {
            games.findById(10).done(function (game) {
                assert.equal("second version", game.someField);
                done();
            });
        })
    });

    it('Calculates percentiles of player stats', function (done) {
        var game = {
            "gameId": 11919,
            "playerTimeData": {
                "6100": [
                    {"timepoint": 1387745097889, "armyCount": 1, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": 10, "energyIncomeNet": 1000, "metalSpending": 0, "energySpending": 0, "metalStored": 800, "energyStored": 12000, "metalProduced": 38, "energyProduced": 3778, "metalWasted": 38, "energyWasted": 3778, "apm": 2},
                    {"timepoint": 1387745102761, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 759, "energyStored": 10992, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 30, "energyWasted": 2995, "apm": 4},
                    {"timepoint": 1387745107750, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 660, "energyStored": 8523, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 0, "energyWasted": 0, "apm": 5}
                ],
                "3866": [
                    {"timepoint": 1387745098815, "armyCount": 1, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": 10, "energyIncomeNet": 1000, "metalSpending": 0, "energySpending": 0, "metalStored": 800, "energyStored": 12000, "metalProduced": 49, "energyProduced": 4863, "metalWasted": 49, "energyWasted": 4863, "apm": 5},
                    {"timepoint": 1387745103712, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 720, "energyStored": 10024, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 10, "energyWasted": 1045, "apm": 4},
                    {"timepoint": 1387745108706, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 620, "energyStored": 7510, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 0, "energyWasted": 0, "apm": 5}
                ],
                "3739": [
                    {"timepoint": 1387745098080, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 755, "energyStored": 10882, "metalProduced": 40, "energyProduced": 3991, "metalWasted": 18, "energyWasted": 1767, "apm": 5},
                    {"timepoint": 1387745102952, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 654, "energyStored": 8366, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 0, "energyWasted": 0, "apm": 6},
                    {"timepoint": 1387745107941, "armyCount": 3, "metalIncome": 17, "energyIncome": 1000, "metalIncomeNet": -13, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 596, "energyStored": 7247, "metalProduced": 64, "energyProduced": 5001, "metalWasted": 0, "energyWasted": 0, "apm": 4}
                ],
                "8898": [
                    {"timepoint": 1387745097520, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 789, "energyStored": 11740, "metalProduced": 33, "energyProduced": 3340, "metalWasted": 28, "energyWasted": 2848, "apm": 7},
                    {"timepoint": 1387745102428, "armyCount": 2, "metalIncome": 10, "energyIncome": 1000, "metalIncomeNet": -20, "energyIncomeNet": -500, "metalSpending": 30, "energySpending": 1500, "metalStored": 688, "energyStored": 9220, "metalProduced": 50, "energyProduced": 5000, "metalWasted": 0, "energyWasted": 0, "apm": 7},
                    {"timepoint": 1387745107501, "armyCount": 2, "metalIncome": 17, "energyIncome": 1000, "metalIncomeNet": 17, "energyIncomeNet": 1000, "metalSpending": 0, "energySpending": 0, "metalStored": 598, "energyStored": 7099, "metalProduced": 52, "energyProduced": 5000, "metalWasted": 0, "energyWasted": 0, "apm": 1}
                ]
            },
            "playerInfo": {
                "8898": {"name": "[RLM] masterofn0ne", "color": "rgb(206,51,122)"},
                "6100": {"name": "ORFJackal", "color": "rgb(113,52,165)"},
                "3739": {"name": "๖ۣۜZaphodX", "color": "rgb(255,144,47)"},
                "3866": {"name": "[RLM] beire", "color": "rgb(142,107,68)"}
            }
        };

        games.save(game)
            .then(function () {
                return analytics.refreshAndGet(5000)
            })
            .done(function (stats) {
                assert.deepEqual([654, 688, 720, 759], stats.metalStored.values);
                assert.deepEqual([25, 50, 75, 100], stats.metalStored.percentiles);
                done();
            });
    });
});
