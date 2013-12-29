// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var rest = require('./rest');
var db = require('./db');

exports.updateGame = function (url, callback) {
    rest.getObject(url, function (game) {
        //console.log(game);
        db.games.findOne({ gameId: game.gameId }, function (err, old) {
            assert.equal(null, err);
            if (old) {
                game._id = old._id;
            }
            db.games.save(game, {w: 1}, function (err, result) {
                assert.equal(null, err);
                callback(game);
            });
        })
    });
};
