(function () {
    'use strict';

    angular.module('starter').controller('promotionsController', ['$scope', '$state', 'serviceApi', 'applicationLocalStorageService', 'commonHelper', promotionsController]);

    function promotionsController($scope, $state, serviceApi, applicationLocalStorageService, commonHelper) {
        console.log('In promotion Controller');
        
        if (!applicationLocalStorageService.checkKey('PromotionList')) {
            serviceApi.getPromotions()
            .then(function (response) {
                $scope.promotions = response;
                applicationLocalStorageService.storeCache('PromotionList', response);
            },
            function (err) {

            });
        }
        else {
            $scope.promotions = applicationLocalStorageService.getCache('PromotionList');
        }
    }
})();