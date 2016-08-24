(function () {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    angular.module('healthApp.services', ['ionic', 'healthApp.config', 'ngCordova'])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.headers.post = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        };
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }]);

}());