// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var assert = require('assert');
var updater = require('../server/updater');

describe('Updater:', function () {

    it("Looks for new game in chunks", function () {
        var now = 10000;
        var config = {
            samplingPeriod: 3500,
            samplingChunkSize: 1000
        };

        var chunks = updater._chunks(now, config);

        assert.deepEqual([
            {start: 9000, duration: 1000},
            {start: 8000, duration: 1000},
            {start: 7000, duration: 1000},
            {start: 6500, duration: 500}
        ], chunks)
    });

    it("Converting a chunk to a service URL", function () {
        assert.equal('http://www.nanodesu.info/pastats/report/winners?start=123&duration=5',
            updater._chunkToUrl({start: 123111, duration: 5111}));
    })
});
