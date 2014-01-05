// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

var config = {
    port: process.env.PA_MENTOR_PORT || 8080,
    dbUri: process.env.PA_MENTOR_DB_URI || 'mongodb://localhost:27017/pa-mentor-test',
    updateInterval: Math.max(SECOND, process.env.PA_MENTOR_UPDATE_INTERVAL || HOUR),
    samplingPeriod: Math.max(SECOND, process.env.PA_MENTOR_SAMPLING_PERIOD || 3 * DAY),
    samplingChunkSize: Math.max(SECOND, process.env.PA_MENTOR_SAMPLING_CHUNK_SIZE || DAY)
};

module.exports = config;
