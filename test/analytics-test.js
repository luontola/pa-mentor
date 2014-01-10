// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var sinon = require('sinon');
var analytics = require('../server/analytics');
var games = require('../server/games');
var db = require('../server/db');

function someStatValue(value) {
    return { timepoint: 0, someStat: [value] };
}

describe('Analytics:', function () {

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

            analytics._map.apply(game);

            assert.deepEqual([0, { timepoint: 0, stat1: [1] }], emit.getCall(0).args);
            assert.deepEqual([5000, { timepoint: 5000, stat1: [2] }], emit.getCall(1).args);
            assert.deepEqual([10000, { timepoint: 10000, stat1: [3] }], emit.getCall(2).args);
        });

        it("Emits multiple stats", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10}
                    ]
                }
            };

            analytics._map.apply(game);

            assert.deepEqual([0, { timepoint: 0, stat1: [1], stat2: [10] }], emit.getCall(0).args);
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

            analytics._map.apply(game);

            assert.deepEqual([0, { timepoint: 0, stat1: [1] }], emit.getCall(0).args);
            assert.deepEqual([0, { timepoint: 0, stat1: [2] }], emit.getCall(1).args);
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

            analytics._map.apply(game);

            assert.deepEqual([0, { timepoint: 0, stat1: [1] }], emit.getCall(0).args);
            assert.deepEqual([5000, { timepoint: 5000, stat1: [2] }], emit.getCall(1).args);
            assert.deepEqual([10000, { timepoint: 10000, stat1: [3] }], emit.getCall(2).args);
        });
    });

    describe("#_reduce()", function () {

        it("Keeps timepoint and merges sorted values", function () {
            var entries = [
                { timepoint: 5000, someStat: [1, 3] },
                { timepoint: 5000, someStat: [2, 4] }
            ];

            var results = analytics._reduce(0, entries);

            assert.deepEqual({ timepoint: 5000, someStat: [1, 2, 3, 4] }, results);
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
        describe("Satisfies the requirements for a reduce function", function () {
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
            db.removeAll()
                .then(function () {
                    return games.save(game);
                })
                .then(analytics.refresh)
                .fin(done).done();
        });

        it("Returns the stats at the specified timepoint", function (done) {
            analytics.at(5000).done(function (data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Rounds the timepoint if there is no exact match", function (done) {
            analytics.at(5100).done(function (data) {
                assert.equal(5000, data.timepoint);
                assert.deepEqual([2], data.stat.values);
                done();
            });
        });

        it("Timepoint into future returns the last timepoint", function (done) {
            analytics.at(24 * 3600 * 1000).done(function (data) {
                assert.equal(10000, data.timepoint);
                assert.deepEqual([3], data.stat.values);
                done();
            });
        });

        it("Timepoint into past returns the first timepoint", function (done) {
            analytics.at(-1).done(function (data) {
                assert.equal(0, data.timepoint);
                assert.deepEqual([1], data.stat.values);
                done();
            });
        });

        it("Gives an error if there is no data", function (done) {
            db.removeAll()
                .then(function () {
                    return analytics.at(0);
                })
                .done(assert.fail, function (err) {
                    assert.ok(err instanceof Error);
                    done();
                });
        });
    });
});
