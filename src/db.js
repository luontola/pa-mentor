// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var mongojs = require('mongojs');

var db = mongojs('mongodb://localhost:27017/paMentorTest', ['games', 'stats']);

db.games.ensureIndex({ gameId: 1 }, { unique: true }, function (err) {
    if (err) {
        throw err;
    }
});

db.stats.ensureIndex({'value.timepoint': 1}, { unique: true }, function (err) {
    if (err) {
        throw err;
    }
});

module.exports = db;
