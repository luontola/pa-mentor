// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

pamentor = (function () {

    // Time

    var pamentor = {};
    pamentor.timesyncWallTime = ko.observable(0);
    pamentor.timesyncGameTime = ko.computed(function () {
        pamentor.timesyncWallTime(new Date().getTime());
        return model.currentTimeInSeconds() * 1000;
    });
    pamentor.timeSincePlayStart = ko.observable(0);
    pamentor._timeSincePlayStart = function () {
        var now = new Date().getTime();
        var diff = now - pamentor.timesyncWallTime();
        return diff + pamentor.timesyncGameTime();
    };
    pamentor.updateClock = function () {
        pamentor.timeSincePlayStart(pamentor._timeSincePlayStart());
    };

    // Stats

    pamentor.stats = ko.observable({});
    pamentor.statsServer = 'http://127.0.0.1:8080'; // TODO: change to the production URL when done
    pamentor.updateStats = function () {
        $.getJSON(pamentor.statsServer + '/api/stats/' + pamentor.timeSincePlayStart(), function (stats) {
            pamentor.stats(stats);
        });
    };

    function findPercentile(name) {
        var stats = pamentor.stats()[name];
        if (!stats) {
            return '?';
        }
        var myValue = pamentor[name].value();
        var myPercentile = 0;
        for (var i = 0; i < stats.values.length; i++) {
            if (stats.values[i] < myValue) {
                myPercentile = stats.percentiles[i];
            }
        }
        return myPercentile;
    }

    pamentor.armyCount = {
        value: ko.computed(function () {
            return model.armySize();
        }),
        percentile: ko.computed(function () {
            return findPercentile('armyCount');
        })
    };

    return pamentor;
})();
