// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var db = require('./db');

var stats = {};

stats._map = function () {
    // TODO
    emit(5000, {"metalStored": [759]});
    emit(5000, {"metalStored": [720]});
    emit(5000, {"metalStored": [654]});
    emit(5000, {"metalStored": [688]});
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
        var percentiles = [25, 50, 75, 100]; // TODO
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
            {
                out: 'stats'
            },
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
