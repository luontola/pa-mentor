// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

pamentor = (function () {

    const PROD_SERVER = 'http://pa-mentor.orfjackal.net';
    const DEV_SERVER = 'http://127.0.0.1:8080';

    // Time

    var pamentor = {};
    pamentor.timesyncWallTime = ko.observable(0);
    pamentor.timesyncGameTime = ko.computed(function () {
        pamentor.timesyncWallTime(Date.now());
        return Math.round(model.currentTimeInSeconds() * 1000);
    });
    pamentor.timeSincePlayStart = ko.observable(0);
    pamentor._timeSincePlayStart = function () {
        var diff = Date.now() - pamentor.timesyncWallTime();
        return diff + pamentor.timesyncGameTime();
    };
    pamentor.updateClock = function () {
        pamentor.timeSincePlayStart(pamentor._timeSincePlayStart());
    };

    // Stats

    pamentor.stats = ko.observable({});
    pamentor.statsServer = PROD_SERVER;
    changeStatsServerIfAvailable(DEV_SERVER);

    pamentor.updateStats = function () {
        $.getJSON(pamentor.statsServer + '/api/stats/' + pamentor.timeSincePlayStart(), function (stats) {
            pamentor.stats(stats);
        });
    };
    pamentor.variables = ko.observableArray();

    initVariable('Unit Count', 'armyCount', model.armySize);
    initVariable('Metal Income', 'metalIncome', model.metalGain);
    initVariable('Metal Spending', 'metalSpending', model.metalLoss);
    initVariable('Energy Income', 'energyIncome', model.energyGain);
    initVariable('Energy Spending', 'energySpending', model.energyLoss);

    function changeStatsServerIfAvailable(newUrl) {
        $.get(newUrl)
            .done(function (data) {
                if (data.indexOf('PA Mentor') >= 0) {
                    console.log("Switching to use %s for PA Mentor data", newUrl);
                    pamentor.statsServer = newUrl;
                } else {
                    console.log("%s looks foreign, so continuing to use %s for PA Mentor data", newUrl, pamentor.statsServer);
                }
            })
            .fail(function () {
                console.log("%s was unresponsive, so continuing to use %s for PA Mentor data", newUrl, pamentor.statsServer);
            })
    }

    function findPercentile(value, stats) {
        if (!stats) {
            return -1;
        }
        var myPercentile = 0;
        for (var i = 0; i < stats.values.length; i++) {
            if (stats.values[i] < value) {
                myPercentile = stats.percentiles[i];
            }
        }
        return myPercentile;
    }

    function initVariable(label, id, valueFn) {
        var value = ko.computed(valueFn);
        var percentile = ko.computed(function () {
            return findPercentile(value(), pamentor.stats()[id]);
        });
        var status = ko.computed(function () {
            var p = percentile();
            if (p >= 75) {
                return 'good';
            }
            if (p >= 50) {
                return 'acceptable';
            }
            if (p >= 25) {
                return 'bad';
            }
            if (p >= 0) {
                return 'awful';
            }
            return null;
        });
        var variable = {
            label: label,
            value: value,
            percentile: percentile,
            status: status
        };
        pamentor[id] = variable;
        pamentor.variables.push(variable);
    }

    return pamentor;
})();
