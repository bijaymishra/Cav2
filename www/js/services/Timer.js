(function() {
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function Timer(Analytics) {

        var timings = {};


        function startTimer(category, variable, label) {
            timings[category + variable + label] = {
                start: new Date()
            };
        }

        function endTimer(category, variable, label) {
            var t = timings[category + variable + label];
            if (t) {
                Analytics.trackTiming({
                    category: category,
                    variable: variable,
                    label: label,
                    milliseconds: new Date() - t.start
                });
            }
        }

        return {
            start: startTimer,
            end: endTimer
        };
    }

    Timer.$inject = ['Analytics'];
    angular.module('healthApp.services').factory('Timer', Timer);

}());