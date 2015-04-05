// Copyright © 2013-2015 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

'use strict';

(function () {

    model.pamentor = {};
    model.pamentor.state = ko.observable({});
    addLinkageLiveGame('model.pamentor.state()', 'model.pamentor.state');

    model.pamentor.ignoreResult = ko.observable(null);
    model.pamentor.adjustTeamSize = function (change) {
        evalLiveGame('model.pamentor.adjustTeamSize(' + change + ')', 'model.pamentor.ignoreResult');
    };

    createFloatingFrame('pa_mentor_frame', 100, 100, {'offset': 'leftCenter', 'left': 0});
    $('#pa_mentor_frame').attr('data-bind', 'visible: pamentor.state().visible');
    $('#pa_mentor_frame_content').append(loadHtml('coui://ui/mods/PAMentor/LiveGame_FloatZone/pa_mentor.html'));

})();
