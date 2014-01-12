// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

"use strict";

require('log-timestamp');
var server = require('./server');
var updater = require('./updater');

server.start().then(updater.start).done();
