(function () {
    'use strict';

    angular.module('starter').controller('locationchangeController', ['$scope', '$rootScope', '$state', 'geolocationService', 'serviceApi', 'commonHelper', '$stateParams', '$ionicModal', '$ionicNavBarDelegate', 'applicationLocalStorageService', 'sqliteService', 'locationChangeService', 'GENERAL_CONFIG', locationchangeController]);

    function locationchangeController($scope, $rootScope, $state, geolocationService, serviceApi, commonHelper, $stateParams, $ionicModal, $ionicNavBarDelegate, applicationLocalStorageService, sqliteService, locationChangeService,GENERAL_CONFIG) {

        $scope.restore = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };
        $scope.$on('modal.hidden', function () {
            // Execute action
            if ($scope.restore.code != "") {

                $scope.zipcode.city = '';
                if ($scope.restore.code != "")
                    $scope.zipcode.code = $scope.restore.code;
            } else {
                $scope.zipcode.code = '';
                if ($scope.restore.city != "")
                    $scope.zipcode.city = $scope.restore.city;
                if ($scope.restore.abbreviation != "")
                    $scope.zipcode.state.abbreviation = $scope.restore.abbreviation;
                if ($scope.restore.stateindex != "")
                    $scope.zipcode.state = $scope.states[$scope.restore.stateindex];
            }

        });
        $scope.zipcode = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };

        $scope.openModal = function () {

            $scope.restore.code = $scope.zipcode.code;
            $scope.restore.city = $scope.zipcode.city;
            $scope.restore.abbreviation = $scope.zipcode.state.abbreviation;
            $scope.restore.stateindex = $scope.zipcode.stateindex;

            $scope.zipcode.code = '';
            $scope.zipcode.city = '';
            $scope.zipcode.abbreviation = '';
            $scope.zipcode.state = $scope.states[0];

            $scope.modal.show();
        };
        $scope.updatelocation = function () {
            $scope.restore.code = $scope.zipcode.code;
            $scope.restore.city = $scope.zipcode.city;
            $scope.restore.abbreviation = $scope.zipcode.state.abbreviation;
            var ind = 0;

            angular.forEach($scope.states, function (value, key) {
                if ($scope.states[key].abbreviation == $scope.zipcode.state.abbreviation) {
                    ind = key;
                }

            });
            $scope.restore.stateindex = ind;
            serviceApi.zipcode = $scope.zipcode.code;
            serviceApi.city = $scope.zipcode.city;
            serviceApi.state = $scope.zipcode.state.abbreviation;
            serviceApi.stateindex = ind;
            console.log(serviceApi.zipcode)
            var search = {};
            if ($scope.zipcode.code) {
                search = serviceApi.zipcode;
                $scope.zipcode.city = '';
            } else {

                search = serviceApi.city + "+" + $scope.zipcode.state.name;
                $scope.zipcode.code = "";
            }
            $scope.itemList = '';
            serviceApi.getUpdatedLocation(search)
                .then(function (response) {
                    $scope.modal.hide();
                    //applicationLocalStorageService.storeCache('Latitude', response.results[0].geometry.location.lat);
                    //applicationLocalStorageService.storeCache('Longitude', response.results[0].geometry.location.lng);
                    if (response.results.length > 0) {
                        $rootScope.Latitude = response.results[0].geometry.location.lat;
                        $rootScope.longitude = response.results[0].geometry.location.lng;
                        $scope.pageNumber = 0;
                        $scope.noMoreItemAvailable = false;
                        $scope.itemdata = false;
                        $scope.loadMoreItems();
                    } else {
                        $scope.pageNumber = 0;
                        $scope.noMoreItemAvailable = false;
                        $scope.itemdata = true;
                    }
                    $scope.refine = !$scope.refine;
                    $scope.$watch('refined', function () {
                        $rootScope.refineText = $scope.refined ? 'Refine' : 'Refined';
                    });
                },
                    function (err) {

                    });
        }




        $scope.states = GENERAL_CONFIG.STATES;
        $scope.zipcode.state = $scope.states[serviceApi.stateindex];
        $scope.usemylocation = function () {
            $scope.stores = '';

            geolocationService().then(function (position) {
                $scope.position = position;
                console.log(position.coords.latitude);
                // applicationLocalStorageService.storeCache('Latitude', position.coords.latitude);
                // applicationLocalStorageService.storeCache('Longitude', position.coords.longitude);
                $rootScope.Latitude = position.coords.latitude;
                $rootScope.longitude = position.coords.longitude;
                $scope.pageNumber = 0;
                $scope.noMoreStoreAvailable = false;
                $scope.itemdata = false;
                $scope.loadMoreItems();
                $scope.zipcode.code = '';
                $scope.zipcode.city = '';
                $scope.restore.code = '';
                $scope.restore.city = '';
                $scope.restore.abbreviation = '';
                $scope.restore.stateindex = 0;
                $scope.zipcode.abbreviation = '';
                $scope.zipcode.state = $scope.states[0];
                serviceApi.zipcode = '';
                serviceApi.city = '';
                serviceApi.state = '';
                serviceApi.stateindex = 0;
                $scope.modal.hide();
            }, function (error) {

            });
        }
    }

})();