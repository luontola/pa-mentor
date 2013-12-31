// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var Q = require('q');
var http = require('http');

var rest = {};

function readFully(res, encoding) {
    var result = Q.defer();
    var buffer = '';
    res.setEncoding(encoding);
    res.on('data', function (chunk) {
        buffer += chunk;
    });
    res.on('end', function () {
        result.resolve(buffer);
    });
    res.on('error', function (err) {
        result.reject(err);
    });
    return result.promise;
}

rest.getString = function (url) {
    var result = Q.defer();
    var req = http.get(url, function (res) {
        if (res.statusCode !== 200) {
            result.reject(new Error('Failed to get ' + url + ' - status code was ' + res.statusCode));
        } else {
            result.resolve(readFully(res, 'utf8'));
        }
    });
    req.on('error', function (err) {
        result.reject(new Error('Failed to get ' + url + ' - ' + err.message));
    });
    return result.promise;
};

rest.getObject = function (url) {
    return rest.getString(url).then(JSON.parse);
};

module.exports = rest;
