// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

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
        })
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
});
