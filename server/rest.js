// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var http = require('http');

function readFully(res, encoding, callback) {
    res.setEncoding(encoding);
    var content = '';
    res.on('data', function (chunk) {
        content += chunk;
    });
    res.on('end', function () {
        callback(null, content);
    });
}

exports.getString = function (url, callback) {
    http.get(url,function (res) {
        if (res.statusCode !== 200) {
            callback(new Error('Failed to get ' + url + ' - status code was ' + res.statusCode));
        } else {
            readFully(res, 'utf8', callback);
        }
    }).on('error', function (err) {
                callback(new Error('Failed to get ' + url + ' - ' + err.message));
            });
};

exports.getObject = function (url, callback) {
    exports.getString(url, function (err, content) {
        if (err) {
            callback(err)
        } else {
            callback(null, JSON.parse(content));
        }
    })
};
