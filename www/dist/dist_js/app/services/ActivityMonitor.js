(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function ActivityMonitor($rootScope, $window, $interval, $state) {
        var eventsToMonitor = 'mousemove keydown wheel DOMMouseScroll mousewheel mousedown touchstart touchmove MSPointerDown MSPointerMove';
        var lastActivity = new Date();
        var idleTimeAllowed = 30; //minutes
        //var idleTimeAllowed = 3; //minutes put for testing

        function OnEvent(e) {
            lastActivity = new Date();
            $rootScope.UserActivityTimeout = false;
        }

        function attachEventHandler() {
            eventsToMonitor.split(' ')
                .forEach(function(event) {
                    $window.addEventListener(event, OnEvent);
                });
        }

        function checkUserIdleTime(resumedFromBg) {
            var now = new Date();
            var diffMin = (now - lastActivity) / 60000;
            if ($rootScope.user && $rootScope.user.userId) {
                if (diffMin - idleTimeAllowed >= -1) {
                    $rootScope.UserActivityTimeout = true;
                    $rootScope.$broadcast('UserIdle', {
                        value: diffMin - idleTimeAllowed,
                        resumedFromBg: resumedFromBg
                    });
                }
            }
        }

        function resume() {
            if ($state.is('synchronize')){
                $state.transitionTo('login');
                return;
            }

            checkUserIdleTime(true);
        }

        function initiatlize() {
            $interval(checkUserIdleTime, 60000, 0, false);
            $window.addEventListener("resume", resume, false);
            lastActivity = new Date();
            attachEventHandler();
        }

        return {
            init: initiatlize
        };
    }

    ActivityMonitor.$inject = ['$rootScope', '$window', '$interval', '$state'];
    angular.module('healthApp.services').factory('ActivityMonitor', ActivityMonitor);

}());