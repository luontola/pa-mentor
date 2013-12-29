// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var sinon = require('sinon');
var stats = require('../src/stats');

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

        it("Emits a player's stats at relative timepoints", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10},
                        {"timepoint": 1005000, "stat1": 2, "stat2": 10},
                        {"timepoint": 1010000, "stat1": 2, "stat2": 20}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {stat1: [1], stat2: [10]}], emit.getCall(0).args);
            assert.deepEqual([5000, {stat1: [2], stat2: [10]}], emit.getCall(1).args);
            assert.deepEqual([10000, {stat1: [2], stat2: [20]}], emit.getCall(2).args);
        });

        it("Emits the stats of all players", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10}
                    ],
                    "8898": [
                        {"timepoint": 1000000, "stat1": 2, "stat2": 20}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {stat1: [1], stat2: [10]}], emit.getCall(0).args);
            assert.deepEqual([0, {stat1: [2], stat2: [20]}], emit.getCall(1).args);
        });

        it("Rounds timepoints to 5 seconds", function () {
            var game = {
                "playerTimeData": {
                    "6100": [
                        {"timepoint": 1000000, "stat1": 1, "stat2": 10},
                        {"timepoint": 1007000, "stat1": 2, "stat2": 20},
                        {"timepoint": 1008000, "stat1": 3, "stat2": 30}
                    ]
                }
            };

            stats._map.apply(game);

            assert.deepEqual([0, {stat1: [1], stat2: [10]}], emit.getCall(0).args);
            assert.deepEqual([5000, {stat1: [2], stat2: [20]}], emit.getCall(1).args);
            assert.deepEqual([10000, {stat1: [3], stat2: [30]}], emit.getCall(2).args);
        });
    });

    describe("#_reduce()", function () {

        it("Sorts the values and calculates their percentiles", function () {
            var entries = [
                {stat1: [1], stat2: [10]},
                {stat1: [4], stat2: [20]},
                {stat1: [3], stat2: [17]},
                {stat1: [2], stat2: [15]}
            ];

            var results = stats._reduce(5000, entries);

            assert.deepEqual({
                timepoint: 5000,
                stat1: {
                    values: [1, 2, 3, 4],
                    percentiles: [25, 50, 75, 100]
                },
                stat2: {
                    values: [10, 15, 17, 20],
                    percentiles: [25, 50, 75, 100]
                }
            }, results);
        });

        it("Percentiles are always full percentages", function () {
            var entries = [
                {stat: [10]},
                {stat: [20]},
                {stat: [30]}
            ];

            var results = stats._reduce(5000, entries);

            assert.deepEqual({
                timepoint: 5000,
                stat: {
                    values: [10, 20, 30],
                    percentiles: [33, 67, 100]
                }
            }, results);
        });

        it("Sorting uses numeric sort, not lexical sort", function () {
            var entries = [
                {stat: [1]},
                {stat: [10]},
                {stat: [2]}
            ];

            var results = stats._reduce(0, entries);

            assert.deepEqual([1, 2, 10], results.stat.values);
        });
    });
});
