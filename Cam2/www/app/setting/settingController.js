(function () {
    'use strict';

    angular.module('starter').controller('settingController', ['$scope', 'serviceApi', settingController]);

    function settingController($scope, serviceApi) {
        // code comes here. 
        var vm = this;

        vm.clearedCached = function () {
        };
    };



})();