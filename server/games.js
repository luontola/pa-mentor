// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var assert = require('assert');
var db = require('./db');
var tv4 = require('tv4');

var timepointSchema = {
    title: 'Timepoint',
    description: 'Stats for a single timepoint',
    type: 'object',
    required: [
        'timepoint'
    ],
    properties: {
        timepoint: {
            type: 'number'
        }
    },
    patternProperties: {
        ".+": {
            type: 'number'
        }
    }
};

var teamSchema = {
    title: 'Team',
    description: "A team's composition",
    type: 'object',
    required: [
        'teamId',
        'players'
    ],
    properties: {
        teamId: {
            type: 'number'
        },
        players: {
            type: 'array',
            items: {
                type: 'object',
                required: [
                    'playerId',
                    'playerName'
                ],
                properties: {
                    playerId: {
                        type: 'number'
                    },
                    playerName: {
                        type: 'string'
                    }
                }
            }
        }
    }
};

var playerInfoSchema = {
    title: 'PlayerInfo',
    type: 'object',
    required: [
        'name',
        'color'
    ],
    properties: {
        name: {
            type: 'string'
        },
        color: {
            type: 'string'
        }
    }
};

var gameSchema = {
    title: 'Game',
    type: 'object',
    required: [
        'gameId',
        'startTime',
        'teams',
        'winner',
        'playerTimeData',
        'playerInfo'
    ],
    properties: {
        gameId: {
            type: 'number'
        },
        startTime: {
            type: 'number'
        },
        teams: {
            type: 'array',
            items: teamSchema
        },
        winner: {
            type: 'number'
        },
        playerTimeData: {
            type: 'object',
            patternProperties: {
                "\\d+": {
                    type: 'array',
                    items: timepointSchema
                }
            }
        },
        playerInfo: {
            type: 'object',
            patternProperties: {
                "\\d+": playerInfoSchema
            }
        }
    }
};

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

games.getNewestStartTime = function () {
    return db.games.find({})
        .sort({ startTime: -1 })
        .limit(1)
        .next()
        .then(function (game) {
            if (game) {
                return game.startTime;
            } else {
                return 0;
            }
        });
};

games.removeGamesStartedBefore = function (timestamp) {
    return db.games.remove({ startTime: { $lt: timestamp } });
};

games.validate = function (game) {
    var result = tv4.validateResult(game, gameSchema);
    if (!result.valid) {
        throw new Error('Validation failed '
            + JSON.stringify(result, null, 2)
            + ' for game '
            + JSON.stringify(game));
    }
};

module.exports = games;
