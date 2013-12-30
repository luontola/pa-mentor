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
                result[property] = {
                    values: [ entry[property] ],
                    percentiles: [ 100 ]
                };
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

                var result = convert(entry);
                result.timepoint = roundByMultiple(relativeTime, 5000);
                emit(result.timepoint, result);
            })
        }
    }
};

stats._reduce = function (id, entries) {

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

    function recalculatePercentiles(entry) {
        entry.values.sort(compareNumbers);
        var percentiles = [];
        var count = entry.values.length;
        for (var i = 0; i < count; i++) {
            percentiles.push(Math.round(100 * (i + 1) / count)); // "a*c/b" instead of "a/(b/c)" produces more accurate fractions
        }
        deduplicate(entry.values, percentiles);
        entry.percentiles = percentiles;
        return entry;
    }

    var merged = {};
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        for (var property in entry) {
            if (entry.hasOwnProperty(property)) {

                if (property === 'timepoint') {
                    merged[property] = entry[property];
                } else {
                    var target = merged[property] = (merged[property] || { values: [] });
                    entry[property].values.forEach(function (value) {
                        target.values.push(value);
                    });
                }
            }
        }
    }
    for (var property in merged) {
        if (merged.hasOwnProperty(property) && merged[property].values) {
            recalculatePercentiles(merged[property]);
        }
    }
    return merged;
};

stats.refresh = function (callback) {
    db.games.mapReduce(stats._map, stats._reduce, { out: db.percentiles.name() }, callback);
};

stats.at = function (timepoint, callback) {
    db.percentiles.findOne({ 'value.timepoint': timepoint }, function (err, doc) {
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
