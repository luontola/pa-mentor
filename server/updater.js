// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

var config = require('./config');
var analytics = require('./analytics');

var updater = {};

updater.start = function () {
    var interval = config.updateIntervalSeconds * 1000;

    function updateLoop() {
        console.info("Updating...");
        updater.update(function (err) {
            if (err) {
                console.warn("Failed to update");
                console.warn(err);
            } else {
                console.info("Update done");
            }
            setTimeout(updateLoop, interval);
        });
    }

    updateLoop();
};

updater.update = function (callback) {
    // TODO: fetch games
    analytics.refresh(callback);
};

module.exports = updater;
