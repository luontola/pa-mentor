// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var Q = require('q');
var mongojs = require('./q-mongojs');
var config = require('./config');

var db = mongojs(config.dbUri, ['games', 'percentiles', 'meta']);

db.removeAll = function () {
    return Q.all([
        db.games.remove(),
        db.percentiles.remove()
    ]);
};

function ensureIndexes() {
    return Q.all([
        db.games.ensureIndex({ gameId: 1 }, { unique: true }),
        db.games.ensureIndex({ startTime: 1 }),
        db.percentiles.ensureIndex({'value.timepoint': 1})
    ]);
}

function getMeta() {
    return db.meta.findOne({ _id: 1 })
        .then(function (meta) {
            return meta ? meta : { _id: 1, revision: 0 };
        })
}

function setMeta(meta) {
    return db.meta.save(meta);
}

db.init = function () {
    return getMeta()
        .then(function (meta) {
            console.info("Database revision is %s", meta.revision);
            return meta;
        })
        .then(function (meta) {
            var rev = 20140126;
            if (meta.revision < rev) {
                meta.revision = rev;
                console.info("Upgrading to revision %s", rev);
                // Updater logic was changed. Better re-download everything
                // to make sure that no games are missed.
                return db.games.remove({})
                    .then(function () {
                        return meta;
                    });
            }
            return meta;
        })
        .then(function (meta) {
            var rev = 20140130;
            if (meta.revision < rev) {
                meta.revision = rev;
                console.info("Upgrading to revision %s", rev);
                // Grouping stats by teamSize added. Timepoints are not anymore unique.
                return db.percentiles.dropIndex('value.timepoint_1')
                    .then(function () {
                        return meta;
                    });
            }
            return meta;
        })
        .then(setMeta)
        .then(ensureIndexes);
};

module.exports = db;
