(function () {
    'use strict';

    angular.module('starter').controller('aboutController', ['$scope','GENERAL_CONFIG', aboutController]);

    function aboutController($scope,GENERAL_CONFIG ) {       
        $scope.app_version = GENERAL_CONFIG.APP_VERSION;
        $scope.api_using = GENERAL_CONFIG.API_USING;
    }
})();