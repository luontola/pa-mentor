var assert = require('assert');
var util = require('util');
var http = require('http');
var mongodb = require('mongodb');
var mongojs = require('mongojs');

function readFully(res, encoding, callback) {
    res.setEncoding(encoding);
    var content = '';
    res.on('data', function (chunk) {
        content += chunk;
    });
    res.on('end', function () {
        callback(content);
    });
}

function restGetString(url, callback) {
    var req = http.get(url, function (res) {
        if (res.statusCode !== 200) {
            util.log('WARN: Failed to get ' + url + ' - status code ' + res.statusCode);
            return;
        }
        readFully(res, 'utf8', callback);
    });
    req.on('error', function (e) {
        util.log('WARN: Failed to get ' + url + ' - ' + e.message);
    });
}

function restGetObject(url, callback) {
    restGetString(url, function (content) {
        callback(JSON.parse(content));
    })
}

var db = mongojs('mongodb://localhost:27017/paMentorTest', ['games']);

db.games.ensureIndex({ gameId: 1 }, { unique: true }, function (err) {
    assert.equal(null, err);
});

function updateGame(url, callback) {
    restGetObject(url, function (game) {
        //console.log(game);
        db.games.findOne({ gameId: game.gameId }, function (err, old) {
            assert.equal(null, err);
            if (old) {
                game._id = old._id;
            }
            db.games.save(game, {w: 1}, function (err, result) {
                assert.equal(null, err);
                callback(game);
            });
        })
    });
}

updateGame('http://www.nanodesu.info/pastats/report/get?gameId=11919', function (game) {
    console.log("game is", game);
    db.close();
});
