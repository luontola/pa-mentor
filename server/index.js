// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

require('log-timestamp');
var server = require('./server');
var updater = require('./updater');

server.start(function () {
    updater.start()
});
