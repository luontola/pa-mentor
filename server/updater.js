// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var _ = require('underscore');
var config = require('./config');
var games = require('./games');
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

    function persistGames(gameChunk) {
        var gameIds = _(gameChunk).map(function (game) {
            var gameId = game.gameId;
            if (!gameId) {
                throw new Error("Has no gameId: " + JSON.stringify(game));
            }
            return  gameId;
        });

        console.info("Fetching %s games: %s", gameIds.length, gameIds);

        // TODO: combine the data from all service urls
        return Q.all(_(gameIds).map(function (gameId) {
            return rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=' + gameId)
                .then(games.save);
        }));
    }

    function filterNewGames(gameChunk) {
        return Q.all(_(gameChunk).map(function (game) {
            return games.findById(game.gameId)
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
    var chunks = updater._chunks(Date.now(), config);
    return fetchChunksOfGames(chunks)
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


module.exports = updater;
