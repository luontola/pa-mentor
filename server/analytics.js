// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var db = require('./db');

var analytics = {};

analytics._map = function () {

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

analytics._reduce = function (id, entries) {

    function compareNumbers(a, b) {
        return a - b;
    }

    function sortValues(entry) {
        entry.values.sort(compareNumbers);
        return entry;
    }

    var reduced = {};
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        for (var property in entry) {
            if (entry.hasOwnProperty(property)) {

                if (property === 'timepoint') {
                    reduced[property] = entry[property];
                } else {
                    var target = reduced[property] = (reduced[property] || { values: [] });
                    entry[property].values.forEach(function (value) {
                        target.values.push(value);
                    });
                }
            }
        }
    }
    for (var property in reduced) {
        if (reduced.hasOwnProperty(property) && reduced[property].values) {
            sortValues(reduced[property]);
        }
    }
    return reduced;
};

analytics._finalize = function (id, merged) {

    function deduplicate(values, percentiles) {
        for (var i = 0; i < values.length - 1; i++) {
            if (values[i] === values[i + 1] || percentiles[i] === percentiles[i + 1]) {
                values.splice(i, 1);
                percentiles.splice(i, 1);
                i--;
            }
        }
    }

    function calculatePercentiles(entry) {
        var percentiles = [];
        var count = entry.values.length;
        for (var i = 0; i < count; i++) {
            percentiles.push(Math.round(100 * (i + 1) / count)); // "a*c/b" instead of "a/(b/c)" produces more accurate fractions
        }
        deduplicate(entry.values, percentiles);
        entry.percentiles = percentiles;
        return entry;
    }

    for (var property in merged) {
        if (merged.hasOwnProperty(property) && merged[property].values) {
            calculatePercentiles(merged[property]);
        }
    }
    return merged;
};

analytics.refresh = function () {
    return db.games.mapReduce(
        analytics._map,
        analytics._reduce,
        {
            out: db.percentiles.name(),
            finalize: analytics._finalize
        });
};

analytics.at = function (timepoint) {
    timepoint = Math.max(0, timepoint);
    return db.percentiles
        .find({ 'value.timepoint': { $lte: timepoint }})
        .sort({ 'value.timepoint': -1 })
        .limit(1)
        .next()
        .then(function (doc) {
            if (!doc) {
                throw new Error("No data found at timepoint " + timepoint);
            }
            return doc.value;
        });
};

analytics.refreshAndGet = function (timepoint) {
    return analytics.refresh().then(function () {
        return analytics.at(timepoint);
    });
};

module.exports = analytics;
