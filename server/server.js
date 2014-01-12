// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

var Q = require('q');
var http = require('http');
var express = require('express');
var child_process = require('child_process');
var _ = require('underscore');
var analytics = require('./analytics');
var config = require('./config');

function getFunctionDocs(fn) {
    var code = fn.toString();
    var match = /\/\*\*(.*)\*\//g.exec(code);
    if (match) {
        return match[1].replace(/^\s*|\s*$/g, '');
    } else {
        return '';
    }
}

function getApiDocs() {
    return _.chain(server.routes.get)
        .filter(function (route) {
            return route.path.indexOf('/api') === 0;
        })
        .map(function (route) {
            return {
                description: getFunctionDocs(route.callbacks[0]),
                path: route.path,
                method: route.method
            };
        })
        .value();
}

var server = express();

server.get('/', function (req, res) {
    child_process.exec('git describe --dirty --always', { timeout: 10000 }, function (err, stdout) {
        var version = err ? '' : ' ' + stdout;
        res.setHeader('Content-Type', 'text/plain');
        res.send('PA Mentor' + version);
    });
});

server.get('/api', function (req, res) {
    /** Lists the available API operations */
    res.setHeader('Content-Type', 'application/json');
    res.send(getApiDocs());
});

server.get('/api/stats', function (req, res) {
    /** Shows stats at timepoint 0 */
    res.redirect('/api/stats/0');
});

server.get('/api/stats/:timepoint', function (req, res, next) {
    /** Shows stats at the specified timepoint */
    var timepoint = parseInt(req.params.timepoint);
    analytics.at(timepoint).then(function (data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    }).fail(next);
});

server.start = function () {
    var port = config.port;
    return Q.ninvoke(server, 'listen', port)
        .then(function () {
            console.info("Server listening on port %s", port);
            console.info("Running in %s mode", server.get('env'));
        });
};

module.exports = server;
