// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var mongojs = require('mongojs');
var config = require('./config');

var db = mongojs(config.dbUri, ['games', 'percentiles']);

db.games.ensureIndex({ gameId: 1 }, { unique: true }, function (err) {
    if (err) {
        throw err;
    }
});

db.percentiles.ensureIndex({'value.timepoint': 1}, { unique: true }, function (err) {
    if (err) {
        throw err;
    }
});

db.removeAll = function () {
    return Q.all([
        Q.ninvoke(db.games, 'remove'),
        Q.ninvoke(db.percentiles, 'remove')
    ]);
};

mongojs.Collection.prototype.name = function () {
    var fullName = this._name;
    return fullName.substring(fullName.lastIndexOf('.') + 1);
};

module.exports = db;
