// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var http = require('http');
var util = require('util');

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

exports.getString = function (url, callback) {
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
};

exports.getObject = function (url, callback) {
    exports.getString(url, function (content) {
        callback(JSON.parse(content));
    })
};
