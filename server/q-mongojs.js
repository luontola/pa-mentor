// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var Q = require('q');
var _ = require('underscore');
var mongojs = require('mongojs');


// New helper methods

mongojs.Collection.prototype.name = function () {
    var fullName = this._name;
    return fullName.substring(fullName.lastIndexOf('.') + 1);
};


// Make methods return promises instead of taking callbacks

function denodeifyMethod(obj, methodName) {
    var method = obj[methodName];
    if (!_.isFunction(method)) {
        throw new Error("No method '" + methodName + "'");
    }

    function denodeified() {
        return Q.denodeify(method.bind(this)).apply(void 0, arguments);
    }

    // avoid monkey-patching multiple times, e.g. when using `mocha --watch`
    if (method.name !== denodeified.name) {
        obj[methodName] = denodeified;
    }
}

// Those methods from http://mongodb.github.io/node-mongodb-native/api-generated/collection.html
// which require a callback for returning a single value.
// Excludes 'find' because it uses the callback for iteration - instead use 'find().toArray()'
// or 'find().nextObject()' to get a promise for the search results.
_([
    'aggregate',
    'count',
    'createIndex',
    'distinct',
    'drop',
    'dropAllIndexes',
    'dropIndex',
    'ensureIndex',
    'findAndModify',
    'findAndRemove',
    'findOne',
    'geoHaystackSearch',
    'geoNear',
    'group',
    'indexExists',
    'indexInformation',
    'indexes',
    'insert',
    'isCapped',
    'mapReduce',
    'options',
    'reIndex',
    'remove',
    'rename',
    'runCommand', // added by mongojs
    'save',
    'stats',
    'update'
]).each(_.partial(denodeifyMethod, mongojs.Collection.prototype));

// Those methods from http://mongodb.github.io/node-mongodb-native/api-generated/cursor.html
// which require a callback for returning a single value.
_([
    'count',
    'destroy',  // renamed from 'close' by mongojs
    'explain',
    'next',     // renamed from 'nextObject' by mongojs
    'toArray'
]).each(_.partial(denodeifyMethod, mongojs.Cursor.prototype));

// Those methods from http://mongodb.github.io/node-mongodb-native/api-generated/db.html
// which require a callback for returning a single value.
// Excludes 'collection' because mongojs doesn't have it take a callback.
_([
    'addUser',
    'authenticate',
    'close',
    'collectionNames',
    'collections',
    'collectionsInfo',
    'command',
    'createCollection',
    'createIndex',
    'cursorInfo',
    'dereference',
    'dropCollection',
    'dropDatabase',
    'dropIndex',
    'ensureIndex',
    'eval',
    'getCollectionNames', // added by mongojs (maybe same as 'collectionNames'?)
    'indexInformation',
    'lastError',
    'logout',
    'open',
    'previousErrors',
    'reIndex',
    'removeUser',
    'renameCollection',
    'resetErrorHistory',
    'runCommand', // added by mongojs (like 'command' but adds special handling for shutdown)
    'stats'
]).each(_.partial(denodeifyMethod, mongojs.Database.prototype));

// TODO: wrap the methods of the object returned by db.admin()?

module.exports = mongojs;
