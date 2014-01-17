// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var Q = require('q');
var _ = require('underscore');
var config = require('./config');
var gamesDao = require('./games');
var analytics = require('./analytics');
var rest = require('./rest');

var updater = {};

updater.start = function () {
    var interval = config.updateInterval;

    function updateLoop() {
        console.info("Updating...");
        updater.update()
            .then(function () {
                console.info("Update done");
            })
            .fail(function (err) {
                console.warn("Update failed\n", err.stack);
            })
            .fin(function () {
                setTimeout(updateLoop, interval);
            })
            .done();
    }

    updateLoop();
};

updater.update = function () {

    function persistGames(games) {
        console.info("Fetching %s games: %s", games.length, _(games).pluck('gameId'));

        return Q.all(_(games).map(function (game) {
            return rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=' + game.gameId)
                .then(function (details) {
                    return updater._mergeObjects(game, details);
                })
                .then(gamesDao.save);
        }));
    }

    function filterNewGames(games) {
        return Q.all(_(games).map(function (game) {
            return gamesDao.findById(game.gameId)
                .then(function (persisted) {
                    return persisted ? [] : [game];
                });
        })).then(_.flatten);
    }

    function fetchGameChunk(chunk) {
        var url = updater._chunkToUrl(chunk);
        console.info("Fetching game chunk %s", url);
        return rest.getObject(url);
    }

    function fetchChunksOfGames(chunks) {
        var head = _.first(chunks);
        var tail = _.rest(chunks);
        if (!head) {
            return Q(null);
        }
        return fetchGameChunk(head)
            .then(filterNewGames)
            .then(function (newGames) {
                if (newGames.length === 0) {
                    return null;
                }
                return persistGames(newGames)
                    .then(function () {
                        return tail ? fetchChunksOfGames(tail) : null;
                    });
            });
    }

    // TODO: find the newest game we have persisted and fetch games newer than it (delta ~1 day)
    var now = Date.now();
    var chunks = updater._chunks(now, config);
    var ageLimit = now - config.samplingPeriod;

    return fetchChunksOfGames(chunks)
        .then(function () {
            return gamesDao.removeGamesStartedBefore(ageLimit);
        })
        .then(function () {
            console.log("Refreshing analytics")
        })
        .then(analytics.refresh);
};


updater._chunks = function (now, config) {
    var startLimit = now - config.samplingPeriod;
    var end = now;
    var step = config.samplingChunkSize;

    function nextChunk() {
        var start = Math.max(startLimit, end - step);
        var duration = Math.max(0, end - start);
        if (duration === 0) {
            return null;
        }
        end = start;
        return {
            start: start,
            duration: duration
        };
    }

    var chunks = [];
    var chunk;
    while (chunk = nextChunk()) {
        chunks.push(chunk);
    }
    return chunks;
};

function millisToSeconds(millis) {
    return (millis / 1000).toFixed();
}

updater._chunkToUrl = function (chunk) {
    var start = millisToSeconds(chunk.start);
    var duration = millisToSeconds(chunk.duration);
    return 'http://www.nanodesu.info/pastats/report/winners?start=' + start + '&duration=' + duration;
};

updater._mergeObjects = function (a, b) {
    var merged = {};
    copyNewProperties(a, merged);
    copyNewProperties(b, merged);
    return merged;
};

function copyNewProperties(src, dest) {
    for (var property in src) {
        if (src.hasOwnProperty(property) && !dest[property]) {
            dest[property] = src[property];
        }
    }
}

module.exports = updater;
