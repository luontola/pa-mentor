// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var db = require('./db');
var rest = require('./rest');
var games = require('./games');
var analytics = require('./analytics');

var gameId = process.argv[2] || 11919;

rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=' + gameId, function (err, game) {
    if (err) {
        throw err;
    }
    games.save(game, function (err) {
        console.info(game, err);

        console.info("\nCalculating statistics...");
        analytics.refreshAndGet(5000 * 100, function (err, stats) {
            console.info(JSON.stringify(stats, null, 2));
            db.close();
        });
    });
});
