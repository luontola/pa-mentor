// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var db = require('./db');
var games = require('./games');

games.updateGame('http://www.nanodesu.info/pastats/report/get?gameId=11919', function (game) {
    console.log("game is", game);
    db.close();
});
