// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var Q = require('q');
var mongojs = require('./q-mongojs');
var config = require('./config');

var db = mongojs(config.dbUri, ['games', 'percentiles']);

db.games.ensureIndex({ gameId: 1 }, { unique: true }).done();

db.percentiles.ensureIndex({'value.timepoint': 1}, { unique: true }).done();

db.removeAll = function () {
    return Q.all([
        db.games.remove(),
        db.percentiles.remove()
    ]);
};

module.exports = db;
