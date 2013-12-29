// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var db = require('../src/db');
var games = require('../src/games');

function assertCount(expectedCount, collection, done) {
    collection.count(function (err, actualCount) {
        assert.equal(null, err);
        assert.equal(expectedCount, actualCount);
        done();
    });
}

describe('Games:', function () {
    beforeEach(function (done) {
        db.games.remove(done);
    });

    it('Saves a game to database', function (done) {
        games.save({gameId: 10}, function () {

            assertCount(1, db.games, done);
        });
    });
    it('Saves multiple games to database', function (done) {
        games.save({gameId: 10}, function () {
            games.save({gameId: 20}, function () {

                assertCount(2, db.games, done);
            });
        });
    });
    describe('Saving the same game multiple times', function () {
        beforeEach(function (done) {
            games.save({gameId: 10, someField: "first version"}, function () {
                games.save({gameId: 10, someField: "second version"}, done);
            });
        });
        it('saves only one copy', function (done) {
            assertCount(1, db.games, done);
        });
        it('updates the persisted entity', function (done) {
            db.games.findOne({gameId: 10}, function (err, game) {
                assert.equal("second version", game.someField);
                done();
            });
        })
    });
});
