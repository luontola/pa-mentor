// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var config = require('./config');
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
    var now = new Date().getTime();
    var chunks = updater._chunks(now, config);
    console.log(JSON.stringify(chunks, null, 2));

    // TODO: fetch and save new games
    return rest.getObject('http://www.nanodesu.info/pastats/report/winners?start=1386916400&duration=86400')
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
