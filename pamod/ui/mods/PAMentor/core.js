// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var pamentor = (function () {

    var PROD_SERVER = 'http://pa-mentor.orfjackal.net';
    var DEV_SERVER = 'http://127.0.0.1:8080';

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

    // Game Info

    pamentor.teamSize = ko.observable(getTeamSize());
    pamentor.adjustTeamSize = function (change) {
        var teamSize = Math.max(1, pamentor.teamSize() + change);
        pamentor.teamSize(teamSize);
    };

    function getTeamSize() {
        var teamIndexStr = localStorage['info.nanodesu.pastats.team_index'];
        var teamsStr = localStorage['info.nanodesu.pastats.teams'];
        try {
            if (teamIndexStr && teamsStr) {
                var teamIndex = parseInt(teamIndexStr);
                var teams = JSON.parse(teamsStr);
                for (var i = 0; i < teams.length; i++) {
                    var team = teams[i];
                    if (team.index === teamIndex) {
                        return team.players.length;
                    }
                }
            }
        } catch (e) {
            console.log("Unknown failure; maybe PA Stats became incompatible with PA Mentor?", e.stack ? e.stack : e);
        }
        return 1; // default team size if we can't get it from PA Stats
    }

    // Stats

    pamentor.stats = ko.observable({});
    pamentor.statsServer = PROD_SERVER;
    changeStatsServerIfAvailable(DEV_SERVER);

    pamentor.updateStats = function () {
        var timepoint = pamentor.timeSincePlayStart();
        var teamSize = pamentor.teamSize();
        $.getJSON(pamentor.statsServer + '/api/percentiles/' + timepoint + '?teamSize=' + teamSize, function (stats) {
            pamentor.stats(stats);
        });
    };

    var army = ko.observable(null); // to be filled by the payload of the 'army' event handler
    pamentor.dataSources = {
        army: army,
        armyCount: ko.computed(mkGetIf(army, function (army) {
            return army.army_size;
        })),
        metalIncome: ko.computed(mkGetIf(army, function (army) {
            return army.metal.production;
        })),
        metalSpending: ko.computed(mkGetIf(army, function (army) {
            return army.metal.demand;
        })),
        energyIncome: ko.computed(mkGetIf(army, function (army) {
            return army.energy.production;
        })),
        energySpending: ko.computed(mkGetIf(army, function (army) {
            return army.energy.demand;
        }))
    };

    pamentor.variables = ko.observableArray();
    initVariable('Unit Count', 'armyCount', pamentor.dataSources.armyCount);
    initVariable('Metal Income', 'metalIncome', pamentor.dataSources.metalIncome);
    initVariable('Metal Spending', 'metalSpending', pamentor.dataSources.metalSpending);
    initVariable('Energy Income', 'energyIncome', pamentor.dataSources.energyIncome);
    initVariable('Energy Spending', 'energySpending', pamentor.dataSources.energySpending);

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

    function mkGetIf(srcFn, extractorFn) {
        return function () {
            var value = srcFn();
            return value && extractorFn(value);
        };
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
