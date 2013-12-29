// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var rest = require('./rest');
var db = require('./db');

exports.save = function (game, callback) {
    var gameId = game.gameId;
    assert.ok(gameId);
    db.games.findOne({ gameId: gameId }, function (err, old) {
        if (err) {
            callback(err);
            return;
        }
        if (old) {
            game._id = old._id;
        }
        db.games.save(game, {w: 1}, callback);
    })
};
