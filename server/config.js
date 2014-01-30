// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var SECOND = 1000;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;

var config = {
    port: process.env.PA_MENTOR_PORT || 8080,
    dbUri: process.env.PA_MENTOR_DB_URI || 'mongodb://localhost:27017/pa-mentor-test',
    updateInterval: Math.max(SECOND, process.env.PA_MENTOR_UPDATE_INTERVAL || HOUR),
    retryInterval: Math.max(SECOND, process.env.PA_MENTOR_RETRY_INTERVAL || MINUTE),
    samplingPeriod: Math.max(SECOND, process.env.PA_MENTOR_SAMPLING_PERIOD || 3 * DAY),
    samplingBatchSize: Math.max(SECOND, process.env.PA_MENTOR_SAMPLING_BATCH_SIZE || 3 * HOUR),
    maxGameDuration: 8 * HOUR // just a guess; used in the updater to do overlapping fetches to avoid missing games
};

module.exports = config;
