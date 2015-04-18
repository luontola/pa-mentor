// Copyright © 2013-2015 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

var pamentor = (function () {

    var PROD_SERVER = 'http://pa-mentor.orfjackal.net';
    var DEV_SERVER = 'http://127.0.0.1:8080';

    var pamentor = {};
    pamentor.isVisible = ko.computed(function () {
        return !model.isSpectator() && !model.showLanding();
    });

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
        time: ko.observable({}),
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

    pamentor.timeSincePlayStart = ko.computed(function () {
        // TODO: this should probably be current_time instead of end_time, so that it would be useful during chrono cam
        // TODO: we may need caching the stats for chrono cam, or else the percentages will update very slowly
        var seconds = pamentor.dataSources.time().end_time || 0;
        return seconds * 1000;
    });

    pamentor.variables = ko.observableArray();
    initVariable('Unit Count', 'armyCount', pamentor.dataSources.armyCount);
    initVariable('Metal Income', 'metalIncome', pamentor.dataSources.metalIncome);
    initVariable('Metal Spending', 'metalSpending', pamentor.dataSources.metalSpending);
    initVariable('Energy Income', 'energyIncome', pamentor.dataSources.energyIncome);
    initVariable('Energy Spending', 'energySpending', pamentor.dataSources.energySpending);

    pamentor.state = ko.computed(function () {
        return JSON.stringify({
            visible: pamentor.isVisible(),
            teamSize: pamentor.teamSize(),
            variables: pamentor.variables().map(function (variable) {
                return {
                    label: variable.label,
                    value: variable.value(),
                    percentile: variable.percentile(),
                    status: variable.status()
                }
            })
        });
    });

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
