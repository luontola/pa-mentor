// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var config = {
    port: process.env.PA_MENTOR_PORT || 8080,
    dbUri: process.env.PA_MENTOR_DB_URI || 'mongodb://localhost:27017/paMentorTest',
    updateInterval: Math.max(1000, process.env.PA_MENTOR_UPDATE_INTERVAL || 60 * 60 * 1000)
};

module.exports = config;
