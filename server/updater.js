// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var Q = require('q');
var _ = require('underscore');
var config = require('./config');
var gamesDao = require('./games');
var analytics = require('./analytics');
var rest = require('./rest');

var updater = {};

function updateLoop() {
    console.info("Updating...");
    updater.update()
        .done(function () {
            console.info("Update done");
            setTimeout(updateLoop, config.updateInterval);
        }, function (err) {
            console.warn("Update failed\n", err.stack);
            setTimeout(updateLoop, config.retryInterval);
        });
}

updater.start = function () {
    function toMinutes(millis) {
        return (millis / 1000 / 60).toFixed(1)
    }

    gamesDao.getNewestStartTime()
        .then(function (newestStartTime) {
            var timeSinceUpdate = Date.now() - newestStartTime;
            var nextUpdateDelay = config.updateInterval - timeSinceUpdate;
            if (newestStartTime > 0) {
                console.info("Last updated %s minutes ago", toMinutes(timeSinceUpdate));
                if (nextUpdateDelay > 0) {
                    console.info("Next update in %s minutes", toMinutes(nextUpdateDelay));
                }
            } else {
                console.info("Database empty; updating immediately")
            }
            setTimeout(updateLoop, nextUpdateDelay);
        });
};

updater.update = function () {

    function persistGames(games) {
        console.info("Fetching %s games: %s", games.length, _(games).pluck('gameId'));

        return Q.all(_(games).map(function (game) {
            return rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=' + game.gameId)
                .then(function (details) {
                    var fullGame = updater._mergeObjects(game, details);
                    gamesDao.validate(fullGame);
                    return fullGame;
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
        var head = _.head(chunks);
        var tail = _.tail(chunks);
        if (!head) {
            return Q(null);
        }
        return fetchGameChunk(head)
            .then(filterNewGames)
            .then(persistGames)
            .then(function () {
                return fetchChunksOfGames(tail);
            });
    }

    var now = Date.now();
    var ageLimit = now - config.samplingPeriod;

    return gamesDao.getNewestStartTime()
        .then(function (newestStartTime) {
            var start = newestStartTime - config.samplingBatchSize - config.maxGameDuration;
            if (start < ageLimit) {
                start = ageLimit;
            }
            var chunks = updater._chunks({
                start: start,
                end: now,
                step: config.samplingBatchSize
            });
            return fetchChunksOfGames(chunks);
        })
        .then(function () {
            return gamesDao.removeGamesStartedBefore(ageLimit);
        })
        .then(function () {
            console.info("Refreshing analytics")
        })
        .then(analytics.refresh);
};

updater._chunks = function (opts) {
    var start = opts.start,
        end = opts.end,
        step = opts.step;

    function nextChunk() {
        if (start > end) {
            return null;
        }
        var chunk = {
            start: start,
            duration: step
        };
        start += step;
        return chunk;
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
