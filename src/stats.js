// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var db = require('./db');

var stats = {};

stats._map = function () {

    function convert(entry) {
        var result = {};
        for (var property in entry) {
            if (entry.hasOwnProperty(property) && property !== 'timepoint') {
                result[property] = [ entry[property] ];
            }
        }
        return result;
    }

    function roundByMultiple(n, multiple) {
        return Math.round(n / multiple) * multiple
    }

    var playerTimeData = this.playerTimeData;
    for (var playerId in  playerTimeData) {
        if (playerTimeData.hasOwnProperty(playerId)) {
            var entries = playerTimeData[playerId];
            var startTime = null;
            entries.forEach(function (entry) {
                startTime = startTime || entry.timepoint;
                var relativeTime = entry.timepoint - startTime;
                emit(roundByMultiple(relativeTime, 5000), convert(entry));
            })
        }
    }
};

stats._reduce = function (key, values) {

    function mergeProperties(entries) {
        var merged = {};
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            for (var property in entry) {
                if (entry.hasOwnProperty(property)) {
                    var list = merged[property] = (merged[property] || []);
                    entry[property].forEach(function (value) {
                        list.push(value);
                    });
                }
            }
        }
        return merged;
    }

    function calculatePercentiles(values) {
        values.sort();
        var percentiles = [];
        for (var i = 0; i < values.length; i++) {
            percentiles.push(Math.round(100 / (values.length / (i + 1))));
        }
        return {
            values: values,
            percentiles: percentiles
        };
    }

    var result = mergeProperties(values);
    for (var property in result) {
        if (result.hasOwnProperty(property)) {
            result[property] = calculatePercentiles(result[property]);
        }
    }
    result.timepoint = key;
    return result;
};

stats.refreshAndGet = function (timepoint, callback) {
    db.games.mapReduce(
            stats._map,
            stats._reduce,
            { out: 'stats' },
            function (err) {
                if (err) {
                    callback(err);
                } else {
                    stats.at(timepoint, callback);
                }
            }
    );
};

stats.at = function (timepoint, callback) {
    db.stats.findOne({ 'value.timepoint': timepoint }, function (err, doc) {
        if (err) {
            callback(err);
        } else {
            callback(null, doc.value);
        }
    });
};

module.exports = stats;
