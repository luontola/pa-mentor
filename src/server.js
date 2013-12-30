// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var http = require('http');
var express = require('express');

var server = express();

server.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.send('PA Mentor');
});

server.get('/api/stats', function (req, res) {
    res.redirect('/api/stats/0');
});

server.get('/api/stats/:timepoint', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(["foo", "bar"]);
});

module.exports = server;
