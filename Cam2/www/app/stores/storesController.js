(function() {
    'use strict';
    angular.module('starter').controller('storesController', ['$scope', '$rootScope', '$state', 'geolocationService', 'serviceApi', '$ionicLoading', 'applicationLocalStorageService', 'sqliteService',
        '$ionicModal', '$ionicPopup', '$cordovaGoogleAnalytics', 'GENERAL_CONFIG', storesController
    ]);

    function storesController($scope, $rootScope, $state, geolocationService, serviceApi, $ionicLoading, applicationLocalStorageService, sqliteService, $ionicModal, $ionicPopup, $cordovaGoogleAnalytics, GENERAL_CONFIG) {
        console.log('In stores Controller');
        $scope.states = GENERAL_CONFIG.STATES;
        $scope.storeobj = {
            selectedItem: {},
            storedata: false,
            isFav: false,
            badlocation: false,
            valid: '',
            pageNumber: 0,
            noMoreStoreAvailable: false,
            stores: ''
        };
        $scope.restore = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };
        var isIOS = ionic.Platform.isIOS();
        $scope.$on("resume", function() {
            navigator.geolocation.getCurrentPosition(function(position) {
                if (serviceApi.zipcode == "")
                    $scope.usemylocation();
            }, function(error) {

            });
        });

        //redirect to store detail page
        $scope.redirectToStoreDetail1 = function(storeId) {
            $state.go('app.storeDetail', {
                storeId: storeId,
                from: 'store'
            });
        }
        //load new stores with parameter page number
        $scope.loadMoreStore = function() {
            $scope.storeobj.pageNumber++;
            var startTime = new Date().getTime();
            if ($rootScope.Latitude != 0 && $rootScope.longitude != 0 && $rootScope.Latitude != undefined && $rootScope.longitude != undefined) {
                serviceApi.getStores($scope.storeobj.pageNumber)
                    .then(function(response) {
                            if (window.cordova) {
                                var endTime = new Date().getTime();
                                var timeSpent = endTime - startTime;
                                window.analytics.trackTiming('Store List', timeSpent, 'Load Stores', 'timing');
                            }
                            if (response != "204") {
                                if ($scope.storeobj.stores != undefined && $scope.storeobj.stores.length > 0)
                                    $scope.storeobj.stores = $scope.storeobj.stores.concat(response);
                                else
                                    $scope.storeobj.stores = response;
                            } else {
                                $scope.storeobj.storedata = true;
                                $scope.storeobj.noMoreStoreAvailable = true;
                            }
                            $scope.$broadcast('scroll.infiniteScrollComplete');

                            sqliteService.query("SELECT * FROM stores")
                                .then(function(result) {
                                    var output = [];
                                    for (var i = 0; i < result.rows.length; i++) {
                                        output.push(result.rows.item(i));
                                    }
                                    _.each($scope.stores, function(val1, i) {
                                        _.each(output, function(val2, j) {
                                            if (val1.storeNumber == val2.storeNumber) {
                                                $scope.storeobj.selectedItem[i] = true;
                                            }
                                        });
                                    });
                                });
                            $scope.storeobj.allstores = $scope.storeobj.stores;

                        },
                        function(err) {});
            } else {
                $scope.storeobj.badlocation = true;
                $scope.storeobj.noMoreStoreAvailable = true;
            }

            if ($scope.storeobj.pageNumber == 10) {
                $scope.storeobj.noMoreStoreAvailable = true;
            }
        };
        // for iOS loadmore not start 
        if (isIOS) {
            $scope.loadMoreStore();
        };
        $ionicModal.fromTemplateUrl('app/locationchange/locationchange.html', function($ionicModal) {
            $scope.modal = $ionicModal;
        }, {
            // Use our scope for the scope of the modal to keep it simple
            scope: $scope,
            // The animation we want to use for the modal entrance
            animation: 'slide-in-up'
        }).then(function(modal) {

        });

        $scope.zipcode = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };
        $scope.states = GENERAL_CONFIG.STATES;
        $scope.zipcode.state = $scope.states[serviceApi.stateindex];
        //location change modal open function
        $scope.openModal = function() {
            if (window.cordova)
                $cordovaGoogleAnalytics.trackView("ChangeLocation");
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
        //location change modal hide function
        $scope.$on('modal.hidden', function() {
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
        // when user change location update lat, long
        $scope.updatelocation = function() {
            $scope.storeobj.selectedItem = {};
            $scope.restore.code = $scope.zipcode.code;
            $scope.restore.city = $scope.zipcode.city;
            $scope.restore.abbreviation = $scope.zipcode.state.abbreviation;


            var ind = 0;
            angular.forEach($scope.states, function(value, key) {
                if ($scope.states[key].abbreviation == $scope.zipcode.state.abbreviation) {
                    ind = key;
                }

            });
            $scope.restore.stateindex = ind;
            serviceApi.zipcode = $scope.zipcode.code;
            $scope.modal.hide();
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

            serviceApi.getUpdatedLocation(search)
                .then(function(response) {
                        // $scope.stores = response;

                        console.log(response);
                        if (response.results.length > 0) {
                            $rootScope.Latitude = response.results[0].geometry.location.lat;
                            $rootScope.longitude = response.results[0].geometry.location.lng;
                            $scope.storeobj.storedata = false;
                            $scope.storeobj.badlocation = false;
                            $scope.storeobj.pageNumber = 0;
                            $scope.storeobj.noMoreStoreAvailable = false;
                            $scope.storeobj.stores = '';
                            $scope.loadMoreStore();
                        } else {
                            $scope.storeobj.pageNumber = 0;
                            $scope.storeobj.noMoreStoreAvailable = true;
                            $scope.storeobj.stores = '';
                            $rootScope.Latitude = 0;
                            $rootScope.longitude = 0;
                            $scope.storeobj.storedata = false;
                            $scope.storeobj.badlocation = true;

                        }
                    },
                    function(err) {

                    });
        }
        // user current location fetch
        $scope.usemylocation = function() {
            $ionicLoading.show({
                template: 'Loading...'
            });

            geolocationService().then(function(position) {
                $scope.storeobj.selectedItem = {};
                $scope.storeobj.stores = '';
                $ionicLoading.hide();
                $scope.modal.hide();
                $rootScope.Latitude = position.coords.latitude;
                $rootScope.longitude = position.coords.longitude;
                $scope.storeobj.badlocation = false;
                $scope.storeobj.pageNumber = 0;
                $scope.storeobj.noMoreStoreAvailable = false;
                $scope.storeobj.storedata = false;
                $scope.loadMoreStore();
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

            }, function(error) {
                console.log("errr");
                $ionicLoading.hide();
                if ($scope.storeobj.stores == "") {
                    $scope.storeobj.noMoreStoreAvailable = true;
                    $scope.storeobj.storedata = false;
                    $scope.storeobj.badlocation = true;
                }


                var myPopup = $ionicPopup.show({
                    // template: '',
                    // title: 'Terms',
                    subTitle: "We cannot determine your location. To fix this, go to Location Settings and turn on location services for the Cash America app.",
                    scope: $scope,
                    buttons: [{
                        text: 'Close'
                    }]
                });
                myPopup.then(function(res) {
                    // console.log('Tapped!', res);
                });
            });
        }

        // Add remove favorite stores
        $scope.addRemoveFavorite = function(id, item) {

            if ($scope.storeobj.selectedItem[id]) {
                $scope.storeobj.selectedItem[id] = false;
                sqliteService.query('DELETE from stores WHERE storeNumber="' + item.storeNumber + '"');
                if ($scope.storeobj.isFav == true) {
                    sqliteService.query("SELECT * FROM stores")
                        .then(function(result) {
                            var output = [];
                            $scope.StoresNumbers = [];

                            for (var i = 0; i < result.rows.length; i++) {
                                //output.push(result.rows.item(i));
                                var row = result.rows.item(i);
                                var obj = {
                                    id: row.id,
                                    brand: row.brand,
                                    address: {
                                        address1: row.address1,
                                        address2: row.address2,
                                        state: row.state,
                                        city: row.city
                                    },
                                    distance: row.distance,
                                    latitude: row.latitude,
                                    longitude: row.longitude,
                                    storeNumber: row.storeNumber,
                                    shortName: row.shortName,
                                    favorite: row.favorite
                                };
                                output.push(obj);
                                if (row.favorite == "true")
                                    $scope.storeobj.selectedItem[i] = true;
                            }
                            if (output != null)
                                $scope.storeobj.stores = output;
                            else
                                $scope.storeobj.stores = '';

                        });
                }
            } else {
                $scope.storeobj.selectedItem[id] = true;
                sqliteService.query('INSERT INTO stores (brand,address1,address2,state,city,distance,latitude,longitude,storeNumber,shortName,favorite) VALUES ("' + item.brand + '","' + item.address.address1 + '","' + item.address.address2 + '","' + item.address.state + '","' + item.address.city + '","' + item.distance + '",' + item.latitude + ',"' + item.longitude + '","' + item.storeNumber + '","' + item.shortName + '","' + true + '")');
            }



        };
        //function near me tab
        $scope.fntabNear = function() {
            $scope.storeobj.valid = false;
            window.scrollTo(0, 0);
            $scope.storeobj.pageNumber = 0;
            $scope.storeobj.noMoreStoreAvailable = false;
            $scope.storeobj.selectedItem = {};
            sqliteService.query("SELECT * FROM stores")
                .then(function(result) {
                    var output = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        output.push(result.rows.item(i));
                    }
                    _.each($scope.stores, function(val1, i) {
                        _.each(output, function(val2, j) {
                            if (val1.storeNumber == val2.storeNumber) {
                                $scope.storeobj.selectedItem[i] = true;
                            }
                        });
                    });
                });

            if ($rootScope.Latitude != 0 && $rootScope.Latitude != 0)
                $scope.storeobj.stores = $scope.storeobj.allstores;

            if ($scope.storeobj.isFav == false) {
                $scope.openModal();
            }
            $scope.storeobj.isFav = false;

        }

        // function favorite stores tab
        $scope.fntabFav = function() {
            if (window.cordova) {
                console.log(GENERAL_CONFIG.GA_enabled);
                if (GENERAL_CONFIG.GA_enabled == true || GENERAL_CONFIG.GA_enabled == "true") {
                    $cordovaGoogleAnalytics.trackView("Home");
                }
            }
            $scope.storeobj.isFav = false;
            $scope.storeobj.selectedItem = {};
            $scope.storeobj.noMoreStoreAvailable = true;
            $scope.storeobj.storedata = false;
            $scope.storeobj.badlocation = false;
            sqliteService.query("SELECT * FROM stores")
                .then(function(result) {
                    if (result.rows.length > 0) {
                        var output = [];
                        $scope.StoresNumbers = [];
                        $scope.stores = '';
                        for (var i = 0; i < result.rows.length; i++) {
                            //output.push(result.rows.item(i));
                            var row = result.rows.item(i);
                            var obj = {
                                id: row.id,
                                brand: row.brand,
                                address: {
                                    address1: row.address1,
                                    address2: row.address2,
                                    state: row.state,
                                    city: row.city
                                },
                                distance: row.distance,
                                latitude: row.latitude,
                                longitude: row.longitude,
                                storeNumber: row.storeNumber,
                                shortName: row.shortName,
                                favorite: row.favorite
                            };
                            output.push(obj);
                            if (row.favorite == "true")
                                $scope.storeobj.selectedItem[i] = true;
                        }

                        angular.forEach(output, function(value, key) {
                            $scope.StoresNumbers.push(output[key].storeNumber);
                        });

                        var datatosend = {
                            "Latitude": $rootScope.Latitude,
                            "Longitude": $rootScope.longitude,
                            "Stores": $scope.StoresNumbers
                        };

                        serviceApi.getFavoriteStore(JSON.stringify(datatosend))
                            .then(function(response) {
                                    console.log("getFavoriteStore", response);
                                    $scope.storeobj.isFav = true;
                                    if (response == '204') {
                                        console.log("getFavoriteItems error");
                                    } else {
                                        if (response != null)
                                            $scope.storeobj.stores = response;
                                        else
                                            $scope.storeobj.stores = '';

                                    }
                                },
                                function(err) {
                                    console.log("error in getFavoriteItems");
                                    $scope.storeobj.isFav = true;
                                    $scope.storeobj.stores = '';
                                });

                    } else {
                        $scope.storeobj.stores = '';
                        $scope.storeobj.isFav = true;
                    }
                });


        }

    }
})();