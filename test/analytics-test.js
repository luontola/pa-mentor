// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var _ = require('underscore');
var assert = require('assert');
var sinon = require('sinon');
var analytics = require('../server/analytics');
var gamesDao = require('../server/games');
var db = require('../server/db');

function someStatValue(value) {
    return { timepoint: 0, teamSize: 1, someStat: [value] };
}

describe('Analytics:', function () {

    it('Calculates percentiles of player stats', function (done) {
        // Data based on
        // http://www.nanodesu.info/pastats/report/winners?start=1387745090&duration=3600
        // http://www.nanodesu.info/pastats/report/get?gameId=11919
        var game = {
            "gameId": 11919,
            "teams": [
                { "teamId": 0, "players": [
                    { "playerId": 3866, "playerName": "[RLM] beire" }
                ] },
                { "teamId": 5, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] },
                { "teamId": 1, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] },
                { "teamId": 6, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] },
                { "teamId": 9, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] },
                { "teamId": 2, "players": [
                    { "playerId": 3739, "playerName": "๖ۣۜZaphodX" }
                ] },
                { "teamId": 7, "players": [
                    { "playerId": 6100, "playerName": "ORFJackal" }
                ] },
                { "teamId": 3, "players": [
                    { "playerId": 8898, "playerName": "[RLM] masterofn0ne" }
                ] },
                { "teamId": 8, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] },
                { "teamId": 4, "players": [
                    { "playerId": -1, "playerName": "Anon" }
                ] }
            ],
            "winner": 2,
            "startTime": 1387745093622,
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
        db.removeAll()
            .then(function () {
                return gamesDao.save(game);
            })
            .then(analytics.refresh)
            .then(function () {
                return analytics.getPercentiles(10000)
            })
            .done(function (stats) {
                assert.deepEqual([654, 688, 720, 759], stats.metalStored.values);
                assert.deepEqual([25, 50, 75, 100], stats.metalStored.percentiles);
                done();
            });
    });

    describe("#_map()", function () {
        beforeEach(function () {
            global.emit = global.emit || function () {
            };
            sinon.spy(global, 'emit');
        });
        afterEach(function () {
            global.emit.restore();
        });

        function emittedData() {
            return _.pluck(emit.args, 1);
        }

        it("Emits a player's stats using relative timepoints", function () {
            var game = {
                "startTime": 1000000,
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1},
                        {"timepoint": 1005000, "stat1": 2},
                        {"timepoint": 1010000, "stat1": 3}
                    ]
                }
            };

            analytics._map.apply(game);

            var emitted = emittedData();
            assert.deepEqual({ timepoint: 0, teamSize: 1, stat1: [1] }, emitted[0]);
            assert.deepEqual({ timepoint: 5000, teamSize: 1, stat1: [2] }, emitted[1]);
            assert.deepEqual({ timepoint: 10000, teamSize: 1, stat1: [3] }, emitted[2]);
        });

        it("Emits the number of players in the same team", function () {
            var game = {
                "startTime": 1000000,
                "teams": [
                    { "teamId": 0, "players": [
                        { "playerId": 1000, "playerName": "Lonely 1" }
                    ] },
                    { "teamId": 1, "players": [
                        { "playerId": 2000, "playerName": "Happy 1" },
                        { "playerId": -1, "playerName": "Anon" }
                    ] }
                ],
                "playerTimeData": {
                    "1000": [
                        {"timepoint": 1000000, "stat1": 10}
                    ],
                    "2000": [
                        {"timepoint": 1000000, "stat1": 20}
                    ]
                }
            };

            analytics._map.apply(game);

            var emitted = emittedData();
            assert.deepEqual({ timepoint: 0, teamSize: 1, stat1: [10] }, emitted[0]);
            assert.deepEqual({ timepoint: 0, teamSize: 2, stat1: [20] }, emitted[1]);
        });

        it("Emits multiple stats", function () {
            var game = {
                "startTime": 1000000,
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10}
                    ]
                }
            };

            analytics._map.apply(game);

            var emitted = emittedData();
            assert.deepEqual({ timepoint: 0, teamSize: 1, stat1: [1], stat2: [10] }, emitted[0]);
        });

        it("Emits multiple players, with timepoints relative to the game's start time", function () {
            var game = {
                "startTime": 1000000,
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1005000, "stat1": 1}
                    ],
                    "8898": [
                        {"timepoint": 1010000, "stat1": 2}
                    ]
                }
            };

            analytics._map.apply(game);

            var emitted = emittedData();
            assert.deepEqual({ timepoint: 5000, teamSize: 1, stat1: [1] }, emitted[0]);
            assert.deepEqual({ timepoint: 10000, teamSize: 1, stat1: [2] }, emitted[1]);
        });

        it("Rounds timepoints to 5 seconds", function () {
            var game = {
                "startTime": 1000000,
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1},
                        {"timepoint": 1007000, "stat1": 2},
                        {"timepoint": 1008000, "stat1": 3}
                    ]
                }
            };

            analytics._map.apply(game);

            var emitted = emittedData();
            assert.deepEqual({ timepoint: 0, teamSize: 1, stat1: [1] }, emitted[0]);
            assert.deepEqual({ timepoint: 5000, teamSize: 1, stat1: [2] }, emitted[1]);
            assert.deepEqual({ timepoint: 10000, teamSize: 1, stat1: [3] }, emitted[2]);
        });

        it("Groups the data by timepoint", function () {
            var game = {
                "startTime": 1000000,
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1},
                        {"timepoint": 1005000, "stat1": 2}
                    ],
                    "1203": [
                        {"timepoint": 1000000, "stat1": 3},
                        {"timepoint": 1005000, "stat1": 4}
                    ]
                }
            };

            analytics._map.apply(game);

            var a1 = emit.getCall(0).args;
            var a2 = emit.getCall(2).args;
            assert.equal(a1[1].timepoint, 0);
            assert.equal(a2[1].timepoint, 0);
            assert.equal(a1[0], a2[0]);

            var b1 = emit.getCall(1).args;
            var b2 = emit.getCall(3).args;
            assert.equal(b1[1].timepoint, 5000);
            assert.equal(b2[1].timepoint, 5000);
            assert.equal(b1[0], b2[0]);

            assert.notEqual(a1[0], b1[0]);
        });

        it("Groups the data by teamSize", function () {
            var game = {
                "startTime": 1000000,
                "teams": [
                    { "teamId": 0, "players": [
                        { "playerId": 1001, "playerName": "Lonely 1" }
                    ] },
                    { "teamId": 2, "players": [
                        { "playerId": 1002, "playerName": "Lonely 2" }
                    ] },
                    { "teamId": 1, "players": [
                        { "playerId": 2001, "playerName": "Happy 1" },
                        { "playerId": 2002, "playerName": "Happy 2" }
                    ] }
                ],
                "playerTimeData": {
                    "1001": [
                        {"timepoint": 1000000, "stat1": 1}
                    ],
                    "1002": [
                        {"timepoint": 1000000, "stat1": 2}
                    ],
                    "2001": [
                        {"timepoint": 1000000, "stat1": 3}
                    ],
                    "2002": [
                        {"timepoint": 1000000, "stat1": 4}
                    ]
                }
            };

            analytics._map.apply(game);

            var a1 = emit.getCall(0).args;
            var a2 = emit.getCall(1).args;
            assert.equal(a1[1].teamSize, 1);
            assert.equal(a2[1].teamSize, 1);
            assert.equal(a1[0], a2[0]);

            var b1 = emit.getCall(2).args;
            var b2 = emit.getCall(3).args;
            assert.equal(b1[1].teamSize, 2);
            assert.equal(b2[1].teamSize, 2);
            assert.equal(b1[0], b2[0]);

            assert.notEqual(a1[0], b1[0]);
        });
    });

    describe("#_reduce()", function () {

        it("Keeps timepoint and teamSize, but merges sorted values", function () {
            var entries = [
                { timepoint: 5000, teamSize: 2, someStat: [1, 3] },
                { timepoint: 5000, teamSize: 2, someStat: [2, 4] }
            ];

            var results = analytics._reduce(0, entries);

            assert.deepEqual({ timepoint: 5000, teamSize: 2, someStat: [1, 2, 3, 4] }, results);
        });

        it("Sorting uses numeric sort, not lexical sort", function () {
            var entries = [
                someStatValue(1),
                someStatValue(10),
                someStatValue(2)
            ];

            var results = analytics._reduce(0, entries);

            assert.deepEqual([1, 2, 10], results.someStat);
        });

        // See http://docs.mongodb.org/manual/reference/command/mapReduce/#requirements-for-the-reduce-function
        describe("Satisfies the requirements for a reduce function:", function () {
            var A = someStatValue(Math.floor(Math.random() * 3 + 1));
            var B = someStatValue(Math.floor(Math.random() * 3 + 1));
            var C = someStatValue(Math.floor(Math.random() * 3 + 1));

            it("The type of the return object must be identical to the type of the value emitted by the map function", function () {
                assert.deepEqual(
                    analytics._reduce(0, [C, analytics._reduce(0, [A, B])]),
                    analytics._reduce(0, [C, A, B])
                );
            });
            it("Must be idempotent", function () {
                assert.deepEqual(
                    analytics._reduce(0, [analytics._reduce(0, [A, B, C])]),
                    analytics._reduce(0, [A, B, C])
                );
            });
            it("the order of the elements in the valuesArray should not affect the output of the reduce function", function () {
                assert.deepEqual(
                    analytics._reduce(0, [A, B]),
                    analytics._reduce(0, [B, A])
                );
            });
        })
    });

    describe("#_finalize()", function () {

        it("Calculates percentiles", function () {
            var entry = { timepoint: 5000, someStat: [1, 2, 3, 4] };

            var results = analytics._finalize(0, entry);

            assert.deepEqual({
                timepoint: 5000,
                someStat: {
                    values: [1, 2, 3, 4],
                    percentiles: [25, 50, 75, 100]
                }
            }, results);
        });

        it("Percentiles are always rounded to full percentages", function () {
            var entry = { timepoint: 0, someStat: [10, 20, 30] };

            var results = analytics._finalize(0, entry);

            assert.deepEqual({
                timepoint: 0,
                someStat: {
                    values: [10, 20, 30],
                    percentiles: [33, 67, 100]
                }
            }, results);
        });

        it("Combines repeated values into one", function () {
            var entry = { timepoint: 0, someStat: [1, 1, 1, 2] };

            var results = analytics._finalize(0, entry);

            assert.deepEqual({
                timepoint: 0,
                someStat: {
                    values: [1, 2],
                    percentiles: [75, 100]
                }
            }, results);
        });

        it("Combines repeated percentiles into one", function () {
            var values = [];
            for (var i = 1; i <= 200; i++) {
                values.push(10 * i); // two values for each percentile
            }
            var entry = { timepoint: 0, someStat: values };

            var results = analytics._finalize(0, entry);

            assert.deepEqual([1, 2, 3, 4, 5], results.someStat.percentiles.slice(0, 5));
            assert.deepEqual([20, 40, 60, 80, 100], results.someStat.values.slice(0, 5));
            assert.deepEqual([96, 97, 98, 99, 100], results.someStat.percentiles.slice(95, 100));
            assert.deepEqual([1920, 1940, 1960, 1980, 2000], results.someStat.values.slice(95, 100));
        });

        it("Bugfix: All but the highest value disappearing on deduplication when lots of values", function () {
            // In this data the last 1 belongs to the 100th percentile, but so do also 2 and 3.
            // The deduplication algorithm had a bug which in this case removed all signs of 1 and 2.
            // Instead it should mark 1 as 99th percentile and 3 as 100th percentile, removing only 2.
            var values = [];
            for (var i = 0; i < 298; i++) {
                values.push(1);
            }
            values.push(2);
            values.push(3);
            var entry = { timepoint: 0, someStat: values };

            var results = analytics._finalize(0, entry);

            assert.deepEqual([99, 100], results.someStat.percentiles);
            assert.deepEqual([1, 3], results.someStat.values);
        });
    });

    describe("#getPercentiles()", function () {
        beforeEach(function (done) {
            var game = {
                "gameId": 123,
                "startTime": 10000000,
                "playerTimeData": {
                    "123": [
                        {"timepoint": 10000000, "stat": 1},
                        {"timepoint": 10005000, "stat": 2},
                        {"timepoint": 10010000, "stat": 3}
                    ]
                }
            };
            db.removeAll()
                .then(function () {
                    return gamesDao.save(game);
                })
                .then(analytics.refresh)
                .fin(done).done();
        });

        it("Returns the stats at the specified timepoint", function (done) {
            analytics.getPercentiles(5000).done(function (data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Rounds the timepoint if there is no exact match", function (done) {
            analytics.getPercentiles(5100).done(function (data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Timepoint into future returns the last timepoint", function (done) {
            analytics.getPercentiles(24 * 3600 * 1000).done(function (data) {
                assert.equal(10000, data.timepoint);
                assert.deepEqual([3], data.stat.values);
                done();
            });
        });

        it("Timepoint into past returns the first timepoint", function (done) {
            analytics.getPercentiles(-1).done(function (data) {
                assert.equal(0, data.timepoint);
                assert.deepEqual([1], data.stat.values);
                done();
            });
        });

        it("Gives an error if there is no data", function (done) {
            db.removeAll()
                .then(function () {
                    return analytics.getPercentiles(0);
                })
                .done(assert.fail, function (err) {
                    assert.ok(err instanceof Error);
                    done();
                });
        });
    });
});
