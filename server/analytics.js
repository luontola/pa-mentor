// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var db = require('./db');

var analytics = {};

analytics._map = function () {
    "use strict";
    var game = this;

    function convertVariablesToLists(entry) {
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

    var startTime = game.startTime;
    var playerTimeData = game.playerTimeData;
    for (var playerId in  playerTimeData) {
        if (playerTimeData.hasOwnProperty(playerId)) {
            var entries = playerTimeData[playerId];
            entries.forEach(function (entry) {
                var relativeTime = entry.timepoint - startTime;

                var result = convertVariablesToLists(entry);
                result.timepoint = roundByMultiple(relativeTime, 5000);
                emit(result.timepoint, result);
            })
        }
    }
};

analytics._reduce = function (id, entries) {
    "use strict";

    function compareNumbers(a, b) {
        return a - b;
    }

    function copyOrAppendProperties(dest, src) {
        for (var property in src) {
            if (src.hasOwnProperty(property)) {
                if (src[property].length) {
                    var values = dest[property] = (dest[property] || []);
                    src[property].forEach(function (value) {
                        values.push(value);
                    });
                } else {
                    dest[property] = src[property];
                }
            }
        }
    }

    function sortListProperties(obj) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property) && obj[property].length) {
                obj[property].sort(compareNumbers);
            }
        }
    }

    var reduced = {};
    for (var i = 0; i < entries.length; i++) {
        copyOrAppendProperties(reduced, entries[i]);
    }
    sortListProperties(reduced);
    return reduced;
};

analytics._finalize = function (id, entry) {
    "use strict";

    function deduplicate(values, percentiles) {

        function removeIndex(i) {
            values.splice(i, 1);
            percentiles.splice(i, 1);
        }

        for (var i = 0; i < values.length - 1; i++) {
            if (values[i] === values[i + 1]) {
                removeIndex(i);
                i--;
            }
        }
        for (var i = 0; i < values.length - 1; i++) {
            if (percentiles[i] === percentiles[i + 1]) {
                removeIndex(i);
                i--;
            }
        }
    }

    function calculatePercentiles(values) {
        var percentiles = [];
        var count = values.length;
        for (var i = 0; i < count; i++) {
            percentiles.push(Math.round(100 * (i + 1) / count)); // "a*c/b" instead of "a/(b/c)" produces more accurate fractions
        }
        deduplicate(values, percentiles);
        return { values: values, percentiles: percentiles };
    }

    for (var property in entry) {
        if (entry.hasOwnProperty(property) && entry[property].length) {
            entry[property] = calculatePercentiles(entry[property]);
        }
    }
    return entry;
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

analytics.getPercentiles = function (timepoint) {
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

module.exports = analytics;
