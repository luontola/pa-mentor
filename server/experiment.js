// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var db = require('./db');
var rest = require('./rest');
var games = require('./games');
var analytics = require('./analytics');

rest.getObject('http://www.nanodesu.info/pastats/report/get?gameId=11919', function (game) {
    games.save(game, function (err) {
        console.log(game, err);

        console.log("\nCalculating statistics...");
        analytics.refreshAndGet(5000 * 100, function (err, stats) {
            console.log(JSON.stringify(stats, null, 2));
            db.close();
        });
    });
});
