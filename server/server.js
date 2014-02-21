// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var Q = require('q');
var http = require('http');
var express = require('express');
var child_process = require('child_process');
var _ = require('underscore');
var analytics = require('./analytics');
var config = require('./config');

var version;
function getVersion() {
    if (version) {
        return Q(version);
    }
    return Q.ninvoke(child_process, 'exec', 'git describe --dirty --always', { cwd: __dirname, timeout: 10000 })
        .spread(function (stdout, stderr) {
            version = stdout.trim();
            return version;
        })
        .fail(function (err) {
            console.warn("Failed to get version: " + err);
            return '';
        });
}

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

function optional(value, defaultValue) {
    if (typeof value === typeof defaultValue) {
        return value;
    } else {
        return defaultValue;
    }
}

var server = express();

server.get('/', function (req, res) {
    getVersion().then(function (version) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(('PA Mentor ' + version).trim());
    });
});

server.get('/api', function (req, res) {
    /** Lists the available API operations */
    res.setHeader('Content-Type', 'application/json');
    res.send(getApiDocs());
});

server.get('/api/percentiles', function (req, res) {
    /** Shows percentiles at timepoint 0 */
    res.redirect('/api/percentiles/0');
});

server.get('/api/percentiles/:timepoint', function (req, res, next) {
    /** Shows percentiles at the specified timepoint. Optional 'teamSize' query parameter. */
    var timepoint = parseInt(req.param('timepoint'));
    var teamSize = parseInt(optional(req.param('teamSize'), '1'));
    analytics.getPercentiles({ timepoint: timepoint, teamSize: teamSize }).then(function (data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    }).fail(next);
});

server.start = function () {
    var port = config.port;
    return getVersion()
        .then(function (version) {
            console.info("Application version is %s", version);
            return Q.ninvoke(server, 'listen', port)
        })
        .then(function () {
            console.info("Server listening on port %s", port);
            var env = server.get('env');
            if (env !== 'production') {
                console.warn("Running in %s mode. Some debug information may be exposed!", env);
            }
        });
};

module.exports = server;
