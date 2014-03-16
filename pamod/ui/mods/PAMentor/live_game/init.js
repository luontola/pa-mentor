// Copyright © 2013-2014 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

(function () {

    function hookFunction(obj, fnName, hookFn) {
        var realFn = obj[fnName];
        obj[fnName] = function () {
            realFn.apply(obj, arguments);
            hookFn.apply(obj, arguments);
        };
    }

    model.pamentor = pamentor;
    setInterval(pamentor.updateClock, 1000);
    setInterval(pamentor.updateStats, 5000);

    createFloatingFrame('pa_mentor_frame', 100, 100, {'offset': 'leftCenter', 'left': 0});
    $('#pa_mentor_frame').attr('data-bind', 'visible: !model.isSpectator() && !model.showLanding()');
    $('#pa_mentor_frame_content').append(loadHtml('coui://ui/mods/PAMentor/live_game/pa_mentor.html'));

    hookFunction(handlers, 'army', pamentor.dataSources.army);
})();
