// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var config = require('./config');
var analytics = require('./analytics');
var rest = require('./rest');

var updater = {};

updater.start = function () {
    var interval = config.updateIntervalSeconds * 1000;

    function updateLoop() {
        console.info("Updating...");
        updater.update()
            .then(function () {
                console.info("Update done");
            })
            .fail(function (err) {
                console.warn("Failed to update");
                console.warn(err);
            })
            .fin(function () {
                setTimeout(updateLoop, interval);
            })
            .done();
    }

    updateLoop();
};

updater.update = function () {
    // TODO: fetch and save new games
    return rest.getObject('http://www.nanodesu.info/pastats/report/winners?start=1386916400&duration=86400')
        .then(analytics.refresh);
};

module.exports = updater;
