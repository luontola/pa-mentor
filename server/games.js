// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var assert = require('assert');
var db = require('./db');

var games = {};

games.save = function (game) {
    var gameId = game.gameId;
    assert.ok(gameId, "gameId is missing");
    return games.findById(gameId)
        .then(function (old) {
            if (old) {
                game._id = old._id;
            }
            return db.games.save(game, {w: 1});
        });
};

games.findById = function (gameId) {
    return db.games.findOne({ gameId: gameId });
};

games.removeGamesStartedBefore = function (timestamp) {
    return db.games.remove({ startTime: { $lt: timestamp } });
};

module.exports = games;
