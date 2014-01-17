// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var assert = require('assert');
var updater = require('../server/updater');
var config = require('../server/config');
var gamesDao = require('../server/games');
var analytics = require('../server/analytics');
var db = require('../server/db');

function describeSlow() { // TODO: extract to test helpers
    if (process.argv.indexOf('--watch') >= 0) {
        describe.skip.apply(this, arguments);
    } else {
        describe.apply(this, arguments);
    }
}

describe('Updater:', function () {

    it("Looks for new game in chunks", function () {
        var now = 10000;
        var config = {
            samplingPeriod: 3500,
            samplingChunkSize: 1000
        };

        var chunks = updater._chunks(now, config);

        assert.deepEqual([
            {start: 9000, duration: 1000},
            {start: 8000, duration: 1000},
            {start: 7000, duration: 1000},
            {start: 6500, duration: 500}
        ], chunks)
    });

    it("Converting a chunk to a service URL", function () {
        assert.equal('http://www.nanodesu.info/pastats/report/winners?start=123&duration=5',
            updater._chunkToUrl({start: 123111, duration: 5111}));
    });

    describe("Combining game overview and details:", function () {

        it("Result contains properties from both objects", function () {
            var result = updater._mergeObjects({"a": 1}, {"b": 2});

            assert.deepEqual({"a": 1, "b": 2}, result);
        });

        it("Does not modify the original objects", function () {
            var a = {"a": 1};
            var b = {"b": 2};

            updater._mergeObjects(a, b);

            assert.deepEqual({"a": 1}, a);
            assert.deepEqual({"b": 2}, b);
        });

        it("Properties from the first object take precedence", function () {
            var result = updater._mergeObjects({"x": 1}, {"x": 2});

            assert.deepEqual({"x": 1}, result);
        });
    });

    describeSlow("After updating", function () {
        this.timeout(10 * 1000);
        var oldGame = { gameId: 42, startTime: 100 };
        before(function (done) {
            config.samplingPeriod = 30 * 60 * 1000;
            db.removeAll()
                .then(function () {
                    return gamesDao.save(oldGame);
                })
                .then(updater.update)
                .fin(done).done();
        });

        it("the database should have games", function (done) {
            db.games.findOne({})
                .then(function (game) {
                    assert.ok(game, "no games were found");
                    assert.ok(typeof game.gameId === 'number', "gameId is missing");

                    // properties from details
                    assert.ok(game.playerTimeData instanceof Object, "playerTimeData is missing");
                    assert.ok(game.playerInfo instanceof Object, "playerInfo is missing");

                    // properties from overview
                    assert.ok(game.teams instanceof Array, "teams is missing");
                    assert.ok(typeof game.winner === 'number', "winner is missing");
                    assert.ok(typeof game.startTime === 'number', "startTime is missing");
                })
                .fin(done).done();
        });

        it("the database should have game statistics", function (done) {
            analytics.at(10000)
                .then(function (stats) {
                    assert.ok(stats.armyCount.values.length >= 1, "armyCount.values was empty");
                })
                .fin(done).done()
        });

        it("old games have been removed from the database", function (done) {
            gamesDao.findById(oldGame.gameId)
                .then(function (game) {
                    assert.ok(game === null, "expected old game to have been removed, but it was not");
                })
                .fin(done).done();
        });
    });
});
