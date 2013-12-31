// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var config = {
    port: process.env.PA_MENTOR_PORT || 8080,
    dbUri: process.env.PA_MENTOR_DB_URI || 'mongodb://localhost:27017/paMentorTest'
};

module.exports = config;
