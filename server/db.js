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
        db.percentiles.ensureIndex({'value.timepoint': 1}) // TODO: index for also team size? same or separate index?
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

function upgrade(rev, fn) {
    return function (meta) {
        if (meta.revision < rev) {
            meta.revision = rev;
            console.info("Upgrading to revision %s", rev);
            return Q.fcall(fn).then(function () {
                return meta;
            });
        }
        return meta;
    }
}

db.init = function () {
    return getMeta()
        .then(function (meta) {
            console.info("Database revision is %s", meta.revision);
            return meta;
        })
        .then(upgrade(20140126, function () {
            // Updater logic was changed. Better re-download everything
            // to make sure that no games are missed.
            return db.games.remove({});
        }))
        .then(upgrade(20140130, function () {
            // Grouping stats by teamSize added. Timepoints are not anymore unique.
            return db.percentiles.dropIndex('value.timepoint_1');
        }))
        .then(setMeta)
        .then(ensureIndexes);
};

module.exports = db;
