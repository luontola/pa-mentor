// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var sinon = require('sinon');
var stats = require('../src/stats');
var games = require('../src/games');
var db = require('../src/db');

function someStatValue(value) {
    return {
        timepoint: 0,
        someStat: {
            values: [value],
            percentiles: [100]
        }
    };
}

describe('Stats', function () {

    describe("#_map()", function () {
        beforeEach(function () {
            global.emit = global.emit || function () {
            };
            sinon.spy(global, 'emit');
        });
        afterEach(function () {
            global.emit.restore();
        });

        it("Emits a player's stats using relative timepoints", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1},
                        {"timepoint": 1005000, "stat1": 2},
                        {"timepoint": 1010000, "stat1": 3}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {
                timepoint: 0,
                stat1: { values: [1], percentiles: [100] }
            }], emit.getCall(0).args);

            assert.deepEqual([5000, {
                timepoint: 5000,
                stat1: { values: [2], percentiles: [100] }
            }], emit.getCall(1).args);

            assert.deepEqual([10000, {
                timepoint: 10000,
                stat1: { values: [3], percentiles: [100] }
            }], emit.getCall(2).args);
        });

        it("Emits multiple stats", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {
                timepoint: 0,
                stat1: { values: [1], percentiles: [100] },
                stat2: { values: [10], percentiles: [100] }
            }], emit.getCall(0).args);
        });

        it("Emits multiple players, each with their own local time", function () {
            // TODO: or is the timepoint actually server time, so that we can rely on it being in sync?
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000456, "stat1": 1}
                    ],
                    "8898": [
                        {"timepoint": 1000987, "stat1": 2}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {
                timepoint: 0,
                stat1: { values: [1], percentiles: [100] }
            }], emit.getCall(0).args);

            assert.deepEqual([0, {
                timepoint: 0,
                stat1: { values: [2], percentiles: [100] }
            }], emit.getCall(1).args);
        });

        it("Rounds timepoints to 5 seconds", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1},
                        {"timepoint": 1007000, "stat1": 2},
                        {"timepoint": 1008000, "stat1": 3}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {
                timepoint: 0,
                stat1: { values: [1], percentiles: [100] }
            }], emit.getCall(0).args);

            assert.deepEqual([5000, {
                timepoint: 5000,
                stat1: { values: [2], percentiles: [100] }
            }], emit.getCall(1).args);

            assert.deepEqual([10000, {
                timepoint: 10000,
                stat1: { values: [3], percentiles: [100] }
            }], emit.getCall(2).args);
        });
    });

    describe("#_reduce()", function () {

        it("Merges sorted values and re-calculates percentiles", function () {
            var entries = [
                {
                    timepoint: 5000,
                    someStat: {
                        values: [1, 3],
                        percentiles: [50, 100]
                    }
                },
                {
                    timepoint: 5000,
                    someStat: {
                        values: [2, 4],
                        percentiles: [50, 100]
                    }
                }
            ];

            var results = stats._reduce(5000, entries);

            assert.deepEqual({
                timepoint: 5000,
                someStat: {
                    values: [1, 2, 3, 4],
                    percentiles: [25, 50, 75, 100]
                }
            }, results);
        });

        it("Percentiles are always rounded to full percentages", function () {
            var entries = [
                someStatValue(10),
                someStatValue(20),
                someStatValue(30)
            ];

            var results = stats._reduce(0, entries);

            assert.deepEqual({
                timepoint: 0,
                someStat: {
                    values: [10, 20, 30],
                    percentiles: [33, 67, 100]
                }
            }, results);
        });

        it("Sorting uses numeric sort, not lexical sort", function () {
            var entries = [
                someStatValue(1),
                someStatValue(10),
                someStatValue(2)
            ];

            var results = stats._reduce(0, entries);

            assert.deepEqual([1, 2, 10], results.someStat.values);
        });

        it("Combines repeated values into one", function () {
            var entries = [
                someStatValue(1),
                someStatValue(1),
                someStatValue(1),
                someStatValue(2)
            ];

            var results = stats._reduce(0, entries);

            assert.deepEqual({
                timepoint: 0,
                someStat: {
                    values: [1, 2],
                    percentiles: [75, 100]
                }
            }, results);
        });

        it("Combines repeated percentiles into one", function () {
            var entries = [];
            for (var i = 1; i <= 200; i++) {
                entries.push(someStatValue(10 * i)); // two values for each percentile
            }

            var results = stats._reduce(0, entries);

            assert.deepEqual([1, 2, 3, 4, 5], results.someStat.percentiles.slice(0, 5));
            assert.deepEqual([20, 40, 60, 80, 100], results.someStat.values.slice(0, 5));
            assert.deepEqual([96, 97, 98, 99, 100], results.someStat.percentiles.slice(95, 100));
            assert.deepEqual([1920, 1940, 1960, 1980, 2000], results.someStat.values.slice(95, 100));
        });
    });

    describe("#at()", function () {
        beforeEach(function (done) {
            var game = {
                "gameId": 123,
                "playerTimeData": {
                    "123": [
                        {"timepoint": 10000000, "stat": 1},
                        {"timepoint": 10005000, "stat": 2},
                        {"timepoint": 10010000, "stat": 3}
                    ]
                }
            };
            db.removeAll(function (err) {
                assert.ifError(err);
                games.save(game, function (err) {
                    assert.ifError(err);
                    stats.refresh(done)
                });
            });
        });

        it("Returns the stats at the specified timepoint", function (done) {
            stats.at(5000, function (err, data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Rounds the timepoint if there is no exact match", function (done) {
            stats.at(5100, function (err, data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Timepoint into future returns the last timepoint", function (done) {
            stats.at(24 * 3600 * 1000, function (err, data) {
                assert.equal(10000, data.timepoint);
                assert.deepEqual([3], data.stat.values);
                done();
            });
        });

        it("Timepoint into past returns the first timepoint", function (done) {
            stats.at(-1, function (err, data) {
                assert.equal(0, data.timepoint);
                assert.deepEqual([1], data.stat.values);
                done();
            });
        });
    });
});
