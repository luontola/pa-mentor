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

    function compareNumbers(a, b) {
        return a - b;
    }

    function deduplicate(values, percentiles) {
        for (var i = 0; i < values.length - 1; i++) {
            if (values[i] === values[i + 1] || percentiles[i] === percentiles[i + 1]) {
                values.splice(i, 1);
                percentiles.splice(i, 1);
                i--;
            }
        }
    }

    function calculatePercentiles(values) {
        values.sort(compareNumbers);
        var percentiles = [];
        for (var i = 0; i < values.length; i++) {
            percentiles.push(Math.round(100 * (i + 1) / values.length)); // "a*c/b" instead of "a/(b/c)" produces more accurate fractions
        }
        deduplicate(values, percentiles);
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

stats.refresh = function (callback) {
    db.games.mapReduce(stats._map, stats._reduce, { out: 'stats' }, callback);
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

stats.refreshAndGet = function (timepoint, callback) {
    stats.refresh(function (err) {
        if (err) {
            callback(err);
        } else {
            stats.at(timepoint, callback);
        }
    });
};

module.exports = stats;
