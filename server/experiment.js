// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var db = require('./db');
var rest = require('./rest');
var games = require('./games');
var analytics = require('./analytics');

var gameId = process.argv[2] || 11919;

rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=' + gameId)
    .then(games.save)
    .then(function () {
        console.info("\nCalculating statistics...");
        return analytics.refreshAndGet(5000 * 100);
    })
    .then(function (stats) {
        console.info(JSON.stringify(stats, null, 2));
    })
    .fin(function () {
        db.close();
    })
    .done();
