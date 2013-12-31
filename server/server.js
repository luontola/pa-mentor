// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var http = require('http');
var express = require('express');
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
    return   _.chain(server.routes.get)
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
    res.setHeader('Content-Type', 'text/plain');
    res.send('PA Mentor');
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
    analytics.at(timepoint, function (err, data) {
        if (err) {
            next(err);
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});

server.start = function (callback) {
    var port = config.port;
    server.listen(port, function () {
        console.log("Server listening on port %s", port);
        console.log("Running in %s mode", server.get('env'));
        callback();
    });
};

module.exports = server;
