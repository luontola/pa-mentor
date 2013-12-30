// Copyright © 2013 Esko Luontola <www.orfjackal.net>
// This software is released under the Apache License 2.0.
// The license text is at http://www.apache.org/licenses/LICENSE-2.0

$(function () {

    function loadTemplate(element, url) {
        element.load(url, function () {
            ko.applyBindings(model, element.get(0));
        });
    }

    model.pamentor = pamentor;
    setInterval(pamentor.updateClock, 1000);
    setInterval(pamentor.updateStats, 5000);

    createFloatingFrame('pa_mentor_frame', 100, 100, {'offset': 'leftCenter', 'left': 0});
    loadTemplate($('#pa_mentor_frame_content'), 'coui://ui/mods/PAMentor/live_game/pa_mentor.html');
});
