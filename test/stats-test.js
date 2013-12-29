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
});
