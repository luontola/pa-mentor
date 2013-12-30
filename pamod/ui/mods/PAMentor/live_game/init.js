// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

$(function () {

    function loadTemplate(element, url) {
        element.load(url, function () {
            ko.applyBindings(model, element.get(0));
        });
    }

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
    pamentor.stats = ko.observable({});

    function findPercentile(name) {
        var stats = pamentor.stats()[name];
        if (!stats) {
            return 0;
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

    model.pamentor = pamentor;

    setInterval(function () {
        pamentor.timeSincePlayStart(pamentor._timeSincePlayStart());
    }, 1000);

    setInterval(function () {
        var host = 'http://127.0.0.1:8080'; // TODO: change to the production URL when done
        $.getJSON(host + '/api/stats/' + pamentor.timeSincePlayStart(), function (stats) {
            pamentor.stats(stats);
        });
    }, 5000);

    createFloatingFrame('pa_mentor_frame', 100, 100, {'offset': 'leftCenter', 'left': 0});
    loadTemplate($('#pa_mentor_frame_content'), 'coui://ui/mods/PAMentor/live_game/pa_mentor.html');
});
