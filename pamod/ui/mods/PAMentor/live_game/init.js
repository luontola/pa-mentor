// Copyright © 2013-2015 Esko Luontola <www.orfjackal.net>
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
    setInterval(pamentor.updateStats, 5000);

    hookFunction(handlers, 'time', pamentor.dataSources.time);
    hookFunction(handlers, 'army', pamentor.dataSources.army);

})();
