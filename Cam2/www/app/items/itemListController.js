(function() {
    'use strict';

    angular.module('starter').controller('itemListController', ['$scope', '$rootScope', '$state', 'GENERAL_CONFIG', 'geolocationService', 'serviceApi', 'commonHelper', '$stateParams', '$ionicHistory', '$ionicModal', '$ionicPopup', '$ionicNavBarDelegate', '$ionicLoading', 'applicationLocalStorageService', 'sqliteService', '$cordovaGoogleAnalytics', itemListController]);

    function itemListController($scope, $rootScope, $state, GENERAL_CONFIG, geolocationService, serviceApi, commonHelper, $stateParams, $ionicHistory, $ionicModal, $ionicPopup, $ionicNavBarDelegate, $ionicLoading, applicationLocalStorageService, sqliteService, $cordovaGoogleAnalytics) {
        console.log('In item list Controller');

        $scope.content = {
            categoryname: $stateParams.categoryName,
            search_cat: $stateParams.searchterm,
            resetSearchTerm: $stateParams.searchterm,
            categoryId: $stateParams.categoryCode,
            searchterm: $stateParams.searchterm
        };
        $scope.searchContents = {
            is_undo: false,
            is_global: false
        };

        $scope.ItemListGlobals = {
            noMoreItemAvailable: false,
            pageNumber: 0,
            isFav: false,
            total_items: 0,
            topClearanceItem: $stateParams.from,
            selectedItem: {},
            itemdata: false,
            valid: "",
            badlocation: false,
            storeids: []
        };
        $scope.refineScreenGlobals = {
            refined: false,
            refineText: "Refine",
            maxPrice: 100000,
            minPrice: 0,
            refineChange: false,
            clearPriceMin: false,
            clearPriceMax: false,
            minPriceStat: false,
            maxPriceStat: false,
            resetSelection: [],
            selection: [],
            refineCount: '',
            clearance: null
        };

        $scope.doClear = function(state) {
            if (state == false) {
                $scope.refineScreenGlobals.clearance = null;
            } else if (state != false) {
                $scope.refineScreenGlobals.clearance = true;
            }
        };
        var isIOS = ionic.Platform.isIOS();
        $ionicHistory.clearCache();
        $state.go('app.itemList', {
            reload: true
        });

        $scope.$on("resume", function() {
            navigator.geolocation.getCurrentPosition(function(position) {
                if (serviceApi.zipcode == "" && $scope.content.searchterm == "")
                    $scope.usemylocation();
            }, function(error) {

            });

        });

        $scope.restore = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };
        $scope.all_items_count = 0;
        if ($scope.content.categoryname != "") {
            $scope.title = $scope.content.categoryname;
            $scope.searchContents.is_global = true;
        } else {
            $scope.title = "Search";
            $scope.searchContents.is_global = false;
        }

        $scope.redirectToStoreDetail = function(storeId, item, type) {
            console.log('in redirectToStoreDetail');
            console.log(item);
            $state.go('app.storeDetail', {
                storeId: storeId,
                from: 'product'
            });
        }
        $scope.isMinMaxInvalid = function() {
            if ($scope.datatoRefine.maxPrice == "") {
                $scope.datatoRefine.maxPrice = null;
            }
            if ($scope.datatoRefine.maxPrice != null) {
                return $scope.datatoRefine.minPrice > $scope.datatoRefine.maxPrice;
            }
        };
        $scope.loadMoreItems = function() {
            $scope.ItemListGlobals.pageNumber++;
            console.log($scope.ItemListGlobals.pageNumber);
            if ($scope.ItemListGlobals.itemdata == true) {
                $scope.ItemListGlobals.itemdata = false;
            }
            if ($scope.ItemListGlobals.topClearanceItem == 'clearance' || $scope.refineFlag == true) {

                console.log("Clearnace Item Called");

                var deviceInfo = serviceApi.getDeviceInformation();

                if ($scope.refineFlag) {
                    if ($scope.datatoRefine.maxPrice == null || $scope.datatoRefine.maxPrice == "") {
                        $scope.datatoRefine.maxPrice = $scope.refineScreenGlobals.maxPrice;
                    } else {
                        if ($scope.datatoRefine.maxPrice == 100000) {
                            $scope.refineScreenGlobals.maxPriceStat = true;
                        } else {
                            $scope.datatoRefine.maxPrice = $scope.datatoRefine.maxPrice;
                            $scope.refineScreenGlobals.maxPriceStat = false;
                        }
                    }
                    if ($scope.datatoRefine.minPrice == null || $scope.datatoRefine.minPrice == "") {
                        $scope.datatoRefine.minPrice = $scope.refineScreenGlobals.minPrice;
                    } else {
                        if ($scope.datatoRefine.minPrice == 0) {
                            $scope.refineScreenGlobals.minPriceStat = true;
                        } else {
                            $scope.datatoRefine.minPrice = $scope.datatoRefine.minPrice;
                            $scope.refineScreenGlobals.minPriceStat = false;
                        }
                    }
                    $scope.refinePageNumber++;
                    if ($scope.ItemListGlobals.isFav == true) {
                        if ($scope.content.searchterm != "")
                            var search = $scope.content.searchterm;
                        else
                            var search = null;
                        if ($scope.content.categoryId != 0)
                            var cat_code = [$scope.content.categoryId];
                        else
                            var cat_code = [];
                        $scope.refineDataToSend = {
                            "UniqueId": deviceInfo.Uuid,
                            "SearchTerm": search,
                            "Stores": $scope.ItemListGlobals.storeids,
                            "CategoryCodes": cat_code,
                            "SearchPriceHigh": "99999",
                            "SearchPriceLow": "0",
                            "Longitude": $rootScope.longitude,
                            "Latitude": $rootScope.Latitude,
                            "SearchDistance": "100",
                            "SearchPage": $scope.ItemListGlobals.pageNumber,
                            "ResultsPerPage": "10",
                            "OnlyClearanceItems": $scope.refineScreenGlobals.clearance
                        };
                    } else {
                        $scope.refineDataToSend = {
                            "UniqueId": deviceInfo.Uuid,
                            "SearchTerm": $scope.datatoRefine.refineSearch,
                            "Stores": [],
                            "CategoryCodes": $scope.refineScreenGlobals.selection,
                            "SearchPriceHigh": $scope.datatoRefine.maxPrice,
                            "SearchPriceLow": $scope.datatoRefine.minPrice,
                            "Longitude": $rootScope.longitude,
                            "Latitude": $rootScope.Latitude,
                            "SearchDistance": $scope.datatoRefine.range,
                            "SearchPage": $scope.refinePageNumber,
                            "ResultsPerPage": "10",
                            "OnlyClearanceItems": $scope.refineScreenGlobals.clearance
                        };
                    }
                } else {
                    $scope.refineDataToSend = {
                        "UniqueId": deviceInfo.Uuid,
                        "SearchTerm": null,
                        "Stores": [],
                        "CategoryCodes": [],
                        "SearchPriceHigh": "2000",
                        "SearchPriceLow": "10",
                        "Longitude": $rootScope.longitude,
                        "Latitude": $rootScope.Latitude,
                        "SearchDistance": 100,
                        "SearchPage": $scope.ItemListGlobals.pageNumber,
                        "ResultsPerPage": "10",
                        "OnlyClearanceItems": true
                    };

                }

                serviceApi.refineItem(JSON.stringify($scope.refineDataToSend))
                    .then(function(response) {
                            $scope.RefineResponse = response;
                            if ($scope.RefineResponse != "204") {
                                $scope.ItemListGlobals.total_items = $scope.RefineResponse.numberItemsTotal;
                                if ($scope.itemList != undefined && $scope.itemList.length > 0) {
                                    $scope.itemList = $scope.itemList.concat($scope.RefineResponse.results);
                                } else {
                                    $scope.itemList = $scope.RefineResponse.results;

                                    if ($scope.ItemListGlobals.isFav) {
                                        $scope.fav_total_items = $scope.RefineResponse.numberItemsTotal;
                                        $scope.ItemListGlobals.total_items = $scope.fav_total_items;
                                    } else {
                                        if ($scope.ItemListGlobals.topClearanceItem == "clearance") {

                                            $scope.clearance_total_items = $scope.RefineResponse.numberItemsTotal;
                                            $scope.ItemListGlobals.total_items = $scope.clearance_total_items;
                                            if ($scope.ItemListGlobals.topClearanceItem == "clearance" && $scope.refineScreenGlobals.refined == true) {
                                                $scope.refine_total_items = $scope.RefineResponse.numberItemsTotal;
                                                $scope.ItemListGlobals.total_items = $scope.refine_total_items;
                                            }
                                        } else {
                                            $scope.refine_total_items = $scope.RefineResponse.numberItemsTotal;
                                            $scope.ItemListGlobals.total_items = $scope.refine_total_items;
                                        }
                                    }

                                }
                                $scope.ItemListGlobals.noMoreItemAvailable = false;
                            } else {
                                $scope.ItemListGlobals.noMoreItemAvailable = true;

                                if ($scope.itemList == '' || $scope.itemList == undefined) {
                                    $scope.ItemListGlobals.total_items = 0;
                                    if ($scope.ItemListGlobals.badlocation != true)
                                        $scope.ItemListGlobals.itemdata = true;


                                } else {
                                    $scope.ItemListGlobals.itemdata = false;
                                }

                            }
                            //Issue #110 : This piece of code is to check favorite item in clearance item list.
                            $scope.$broadcast('scroll.infiniteScrollComplete');
                            sqliteService.query("SELECT * FROM items")
                                .then(function(result) {
                                    var output = [];
                                    for (var i = 0; i < result.rows.length; i++) {
                                        output.push(result.rows.item(i));
                                    }
                                    _.each($scope.itemList, function(val1, i) {
                                        _.each(output, function(val2, j) {
                                            if (val1.longICN == val2.longICN) {
                                                $scope.ItemListGlobals.selectedItem[val1.longICN] = true;
                                            }
                                        });
                                    });
                                });

                            if ($scope.ItemListGlobals.isFav == true) {
                                $scope.favStoreitems = $scope.itemList;
                            } else {
                                if ($scope.ItemListGlobals.topClearanceItem == "clearance") {
                                    $scope.clearanceitems = $scope.itemList;
                                    if ($scope.ItemListGlobals.topClearanceItem == "clearance" && $scope.refineScreenGlobals.refined == true) {
                                        $scope.refineitems = $scope.itemList;
                                    }
                                } else {
                                    $scope.refineitems = $scope.itemList;
                                }

                            }
                        },
                        // Code end
                        function(err) {
                            console.log("error in refineItem");
                        });




            } else {

                var startTime = new Date().getTime();
                if ($rootScope.Latitude != 0 && $rootScope.Latitude != 0) {
                    serviceApi.getItemList($scope.content.categoryId, $scope.ItemListGlobals.pageNumber, $scope.content.searchterm)
                        .then(function(response) {
                                if ($scope.content.searchterm != "") {
                                    if (window.cordova) {
                                        var endTime = new Date().getTime();
                                        var timeSpent = endTime - startTime;
                                        window.analytics.trackTiming('Item Search', timeSpent, 'Load Items', 'timing');
                                    }
                                    if ($scope.content.search_cat != "") {
                                        $scope.datatoRefine.refineSearch = $scope.content.search_cat;
                                    }
                                }
                                if (response != "204") {

                                    $scope.ItemListGlobals.total_items = response.numberItemsTotal;
                                    $scope.all_items_count = response.numberItemsTotal;
                                    $scope.ItemListGlobals.itemdata = false;
                                    $scope.ItemListGlobals.noMoreItemAvailable = false;
                                    if ($scope.itemList != undefined && $scope.itemList.length > 0) {
                                        $scope.itemList = $scope.itemList.concat(response.results);
                                    } else {
                                        $scope.itemList = response.results;
                                        $scope.refineitemList = response.results;

                                    }

                                } else {
                                    $scope.ItemListGlobals.noMoreItemAvailable = true;
                                    if ($scope.itemList == "" || $scope.itemList == undefined) {
                                        $scope.ItemListGlobals.total_items = 0;
                                        if ($scope.ItemListGlobals.badlocation != true)
                                            $scope.ItemListGlobals.itemdata = true;
                                    }

                                }
                                $scope.$broadcast('scroll.infiniteScrollComplete');
                                sqliteService.query("SELECT * FROM items")
                                    .then(function(result) {
                                        var output = [];
                                        for (var i = 0; i < result.rows.length; i++) {
                                            output.push(result.rows.item(i));
                                        }
                                        _.each($scope.itemList, function(val1, i) {
                                            _.each(output, function(val2, j) {
                                                if (val1.longICN == val2.longICN) {
                                                    $scope.ItemListGlobals.selectedItem[val1.longICN] = true;
                                                }
                                            });
                                        });
                                    });
                                $scope.allitems = $scope.itemList;
                            },
                            function(err) {

                            });
                } else {
                    $scope.ItemListGlobals.badlocation = true;
                    $scope.ItemListGlobals.noMoreItemAvailable = true;
                }
            }
            if ($scope.ItemListGlobals.pageNumber == 10) {
                $scope.ItemListGlobals.noMoreItemAvailable = true;
            }

        };
        if (isIOS) {
            $scope.loadMoreItems();
        }
        $ionicModal.fromTemplateUrl('app/locationchange/locationchange.html', function($ionicModal) {
            $scope.modal = $ionicModal;

        }, {
            // Use our scope for the scope of the modal to keep it simple
            scope: $scope,
            // The animation we want to use for the modal entrance
            animation: 'slide-in-up'
        });

        $ionicModal.fromTemplateUrl('app/locationchange/locationchange.html', function($ionicModal) {
            $scope.refineChangemodal = $ionicModal;

        }, {
            // Use our scope for the scope of the modal to keep it simple
            scope: $scope,
            // The animation we want to use for the modal entrance
            animation: 'slide-in-up'
        });

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }
        $scope.refinepop = function() {

            $scope.datatoRefine.minPrice = $scope.minPriceReal;
            $scope.datatoRefine.maxPrice = $scope.maxPriceReal;


            $scope.refineModal.show();
        }


        $ionicModal.fromTemplateUrl('app/refine/refinedata.html', {
            scope: $scope,
        }).then(function($ionicModal) {
            $scope.refineModal = $ionicModal;
            $scope.collapse = 'false';
            $scope.datatoRefine = {
                maxPrice: '',
                minPrice: '',
                refineSearch: null,
                range: 25,
                clearanceFlag: false
            };
            $scope.stores = [];
            $scope.singleItem = true;
            $scope.resetProducts = applicationLocalStorageService.getCache('ProductList');
            $scope.resetProduct = _.filter($scope.resetProducts, function(item) {
                return item.parentID == 0;
            });
            console.log($scope.refineScreenGlobals.selection);
            if ($scope.ItemListGlobals.topClearanceItem == "clearance") {
                $scope.refineScreenGlobals.clearance = true;

                $scope.datatoRefine.clearanceFlag = true;
                $scope.products = applicationLocalStorageService.getCache('ProductList');
                $scope.mainProducts = _.filter($scope.products, function(item) {
                    return item.parentID == 0;
                });


                angular.forEach($scope.mainProducts, function(value, key) {
                    $scope.refineScreenGlobals.selection.push($scope.mainProducts[key].categoryCode);
                    $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.selection.length;
                    $scope.singleItem = false;
                });
            } else {
                $scope.products = applicationLocalStorageService.getCache('ProductList');
                $scope.mainProducts = _.filter($scope.products, function(item) {
                    return item.parentID == $scope.content.categoryId;
                });

                angular.forEach($scope.mainProducts, function(value, key) {
                    $scope.refineScreenGlobals.selection.push($scope.mainProducts[key].categoryCode);
                    $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.selection.length;
                    $scope.singleItem = false;

                });
                $scope.resetProduct = _.filter($scope.resetProducts, function(item) {
                    return item.parentID == $scope.content.categoryId;
                });
            }

            $scope.singleProducts = _.filter($scope.products, function(item) {
                return item.categoryCode == $scope.content.categoryId;


            });
            if ($scope.singleItem) {
                angular.forEach($scope.singleProducts, function(value, key) {
                    $scope.refineScreenGlobals.selection.push($scope.singleProducts[key].categoryCode);
                    $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.selection.length;
                });
            }
            $scope.updatCount = function() {
                $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.selection.length;
            }

            $scope.refineApply = function() {
                $scope.minPriceReal = $scope.datatoRefine.minPrice;
                $scope.maxPriceReal = $scope.datatoRefine.maxPrice;
                if ($scope.datatoRefine.minPrice === null) {
                    $scope.datatoRefine.minPrice = "";
                } else {
                    $scope.datatoRefine.minPrice = $scope.datatoRefine.minPrice;
                }


                if ($scope.datatoRefine.maxPrice === 100000 && $scope.refineScreenGlobals.maxPriceStat) {
                    $scope.datatoRefine.maxPrice = "";
                    $scope.refineScreenGlobals.maxPriceStat = false;
                }
                if ($scope.content.search_cat != "") {
                    $scope.content.search_cat = $scope.datatoRefine.refineSearch;
                }
                if ($scope.content.searchterm != "") {
                    $scope.content.searchterm = $scope.content.search_cat;
                }

                if ($scope.ItemListGlobals.isFav == true) {
                    $scope.ItemListGlobals.isFav = false;
                };
                if ($scope.datatoRefine.minPrice >= $scope.datatoRefine.maxPrice) {
                    console.log("resume");
                }
                if (window.cordova) {
                    if (GENERAL_CONFIG.GA_enabled == true || GENERAL_CONFIG.GA_enabled == "true") {
                        $cordovaGoogleAnalytics.trackView("InventoryFilter");
                    }
                }
                $scope.refinePageNumber = 0;
                $scope.clearancePageNumber = 0;
                $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.selection.length;
                $scope.refine = !$scope.refine;
                $scope.ItemListGlobals.itemdata = false;
                $scope.refineScreenGlobals.refined = true;
                $scope.$watch('refineScreenGlobals.refined', function() {
                    $scope.refineScreenGlobals.refineText = $scope.refineScreenGlobals.refined ? 'Refined' : 'Refine';
                });


                $scope.refineFlag = true;
                $scope.loadMoreItems();
                $scope.itemList = '';
                console.log($scope.datatoRefine);
                console.log($scope.refineScreenGlobals.selection);
                console.log($scope.refineDataToSend);
                $scope.refineModal.hide();

            };

        });

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

            //code clean refine price fields
            if ($scope.datatoRefine.minPrice == 0 && !$scope.refineScreenGlobals.clearPriceMin) {
                $scope.datatoRefine.minPrice = '';
            }

            if ($scope.datatoRefine.maxPrice == 100000 && !$scope.refineScreenGlobals.clearPriceMax) {
                $scope.datatoRefine.maxPrice = '';
            }

        });
        $scope.zipcode = {
            code: serviceApi.zipcode,
            city: serviceApi.city,
            abbreviation: serviceApi.state,
            stateindex: serviceApi.stateindex
        };

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
            $scope.ItemListGlobals.valid = false;
            $scope.modal.show();
            $scope.refineScreenGlobals.refineChange = false;

        };

        $scope.refineChangeLocationOpen = function() {
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
            $scope.ItemListGlobals.valid = false;
            $scope.refineChangemodal.show();
            $scope.refineScreenGlobals.refineChange = true;
        }
        $scope.updatelocation = function() {
            $scope.ItemListGlobals.pageNumber = -1;
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
                .then(function(response) {

                        if ($scope.refineScreenGlobals.refineChange == true) {
                            $scope.refineChangemodal.hide();
                            $scope.refineScreenGlobals.refineChange = false;
                        } else {
                            $scope.modal.hide();
                        }
                        window.scrollTo(0, 0);
                        if (response.results.length > 0) {
                            $rootScope.Latitude = response.results[0].geometry.location.lat;
                            $rootScope.longitude = response.results[0].geometry.location.lng;
                            $scope.ItemListGlobals.pageNumber = 0;
                            $scope.ItemListGlobals.noMoreItemAvailable = false;
                            $scope.ItemListGlobals.itemdata = false;
                            $scope.ItemListGlobals.badlocation = false;
                            $scope.loadMoreItems();
                        } else {
                            $rootScope.Latitude = 0;
                            $rootScope.longitude = 0;
                            $scope.ItemListGlobals.pageNumber = 0;
                            $scope.ItemListGlobals.total_items = 0;
                            $scope.ItemListGlobals.noMoreItemAvailable = true;
                            $scope.ItemListGlobals.itemdata = false;
                            $scope.ItemListGlobals.badlocation = true;
                            $scope.refineFlag = false;
                            $scope.refineScreenGlobals.refined = false;
                        }
                        $scope.refine = !$scope.refine;
                        $scope.$watch('refineScreenGlobals.refined', function() {
                            $scope.refineScreenGlobals.refineText = $scope.refineScreenGlobals.refined ? 'Refined' : 'Refine';
                        });
                    },
                    function(err) {

                    });
        }
        $scope.searchLocal = function(search_cat) {
                $scope.refineFlag = false;
                if (search_cat != "" && search_cat.length > 1) {
                    $scope.searchContents.is_undo = true;
                    $scope.content.searchterm = search_cat;
                    $scope.content.resetSearchTerm = search_cat;
                    $scope.itemList = "";
                    $scope.ItemListGlobals.pageNumber = 0;
                    $scope.refineScreenGlobals.refined = false;
                    if ($scope.ItemListGlobals.isFav == true) {
                        $scope.ItemListGlobals.isFav = false;
                    };
                    $scope.$watch('refineScreenGlobals.refined', function() {
                        $scope.refineScreenGlobals.refineText = $scope.refineScreenGlobals.refined ? 'Refined' : 'Refine';
                    });
                    $scope.resetRefine();
                    $scope.loadMoreItems();
                }
            }
            //This code is to reset the refined list.
        $scope.resetRefine = function() {
            $scope.refineScreenGlobals.resetSelection = [];
            $scope.datatoRefine.maxPrice = '';
            $scope.datatoRefine.minPrice = '';
            $scope.datatoRefine.refineSearch = null;
            $scope.datatoRefine.range = 25;
            $scope.minPriceReal = "";
            $scope.maxPriceReal = "";
            $scope.ItemListGlobals.pageNumber = 0;
            $scope.itemList = '';
            if ($scope.ItemListGlobals.topClearanceItem == 'clearance') {
                $scope.datatoRefine.clearanceFlag = true;
            } else {
                $scope.datatoRefine.clearanceFlag = false;
                $rootScope.$watch('datatoRefine.clearanceFlag', function() {
                    $scope.doClear($scope.datatoRefine.clearanceFlag);
                });
            }

            if ($scope.singleItem == false) {
                angular.forEach($scope.resetProduct, function(value, key) {
                    $scope.refineScreenGlobals.resetSelection.push($scope.resetProduct[key].categoryCode);
                });
                $scope.refineScreenGlobals.selection = $scope.refineScreenGlobals.resetSelection;
                $scope.refineScreenGlobals.refineCount = $scope.refineScreenGlobals.resetSelection.length;
            }
            if ($scope.refineScreenGlobals.refined == true) {
                $scope.content.search_cat = $scope.content.resetSearchTerm;
                $scope.content.searchterm = $scope.content.resetSearchTerm;
                $scope.refineFlag = false;
                $scope.refineScreenGlobals.refined = false;
                $scope.loadMoreItems();

            }
        }
        $scope.undoSearch = function() {
            $scope.refineFlag = false;
            $scope.refined = false;
            $scope.searchContents.is_undo = false;
            $scope.content.searchterm = '';
            $scope.content.search_cat = '';
            $scope.datatoRefine.refineSearch = $scope.content.search_cat;
            $scope.itemList = "";
            $scope.ItemListGlobals.pageNumber = 0;
            if ($scope.ItemListGlobals.isFav == true) {
                $scope.ItemListGlobals.isFav = false;
            };
            $scope.$watch('refineScreenGlobals.refined', function() {
                $scope.refineScreenGlobals.refineText = $scope.refineScreenGlobals.refined ? 'Refined' : 'Refine';
            });
            $scope.resetRefine();
            $scope.ItemListGlobals.noMoreItemAvailable = false;
            $scope.loadMoreItems();
        }
        $scope.keyPress = function(keyCode, search) {
            if (keyCode == 13 || keyCode == 10) {
                $scope.searchLocal(search);
            }
        }
        $scope.states = GENERAL_CONFIG.STATES;
        $scope.zipcode.state = $scope.states[serviceApi.stateindex];
        $scope.usemylocation = function() {
            console.log("usemylocation Called");

            $ionicLoading.show({
                template: 'Loading...'
            });

            geolocationService().then(function(position) {
                $scope.position = position;
                console.log(position.coords.latitude);
                $rootScope.Latitude = position.coords.latitude;
                $rootScope.longitude = position.coords.longitude;
                $scope.ItemListGlobals.badlocation = false;
                $scope.ItemListGlobals.pageNumber = 0;
                $scope.ItemListGlobals.itemdata = false;
                $scope.itemList = "";
                $ionicLoading.hide();
                $scope.ItemListGlobals.noMoreItemAvailable = false;
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

                if ($scope.refineScreenGlobals.refineChange == true) {
                    $scope.refineChangemodal.hide();
                    $scope.refineScreenGlobals.refineChange = false;
                } else {
                    $scope.modal.hide();
                }

            }, function(error) {
                $scope.ItemListGlobals.itemdata = false;
                if ($scope.itemList == "") {
                    $scope.ItemListGlobals.badlocation = true;
                    $scope.ItemListGlobals.noMoreItemAvailable = true;
                }

                $ionicLoading.hide();
                var myPopup = $ionicPopup.show({
                    subTitle: "We cannot determine your location. To fix this, go to Location Settings and turn on location services for the Cash America app.",
                    scope: $scope,
                    buttons: [{
                        text: 'Close'
                    }]
                });
                myPopup.then(function(res) {
                });
            });
        }

        $scope.addRemoveFavorite = function(item) {

            if ($scope.ItemListGlobals.selectedItem[item.longICN]) {
                $scope.ItemListGlobals.selectedItem[item.longICN] = false;
                sqliteService.query('DELETE from items WHERE longICN="' + item.longICN + '"');

               

            } else {
                $scope.ItemListGlobals.selectedItem[item.longICN] = true;
                 sqliteService.query("INSERT INTO items (itemName,longICN,details,price,distance,storeNumber,shortName,favorite,isAvailable,categoryCode) VALUES ('" + item.itemName + "','" + item.longICN + "','" + item.details.toString() + "','" + item.price + "','" + item.distance + "','" + item.storeNumber + "','" + item.shortName + "','" + true + "','" + item.isAvailable + "','" + $scope.content.categoryId + "')");
              
            }
        };
        $scope.fntabNear = function() {
            $scope.refineFlag = false;
            $scope.ItemListGlobals.itemdata = false;
            $scope.ItemListGlobals.valid = false;
            $scope.ItemListGlobals.selectedItem = {};
            $scope.ItemListGlobals.pageNumber = 0;

            sqliteService.query("SELECT * FROM items")
                .then(function(result) {
                    var output = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        output.push(result.rows.item(i));
                    }
                    _.each($scope.itemList, function(val1, i) {
                        _.each(output, function(val2, j) {
                            if (val1.longICN == val2.longICN) {
                                $scope.ItemListGlobals.selectedItem[val1.longICN] = true;
                            }
                        });
                    });
                });

            if ($scope.ItemListGlobals.badlocation != true) {
                if ($rootScope.Latitude != 0 && $rootScope.longitude != 0) {
                    if ($scope.refineScreenGlobals.refined == true) {
                        $scope.itemList = $scope.refineitems;
                        $scope.ItemListGlobals.total_items = $scope.refine_total_items;
                        $scope.ItemListGlobals.noMoreItemAvailable = false;
                        $scope.refineFlag = true;
                        $scope.$broadcast('scroll.infiniteScrollComplete');

                    } else {
                        if ($scope.ItemListGlobals.topClearanceItem == 'clearance') {
                            $scope.ItemListGlobals.total_items = $scope.clearance_total_items;
                            $scope.itemList = $scope.clearanceitems;
                        } else {
                            $scope.itemList = $scope.allitems;
                            $scope.ItemListGlobals.total_items = $scope.all_items_count;
                        }


                        window.scrollTo(0, 0);
                        $scope.ItemListGlobals.noMoreItemAvailable = false;
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    }

                } else {
                    if ($scope.itemList.length == 0 || $scope.itemList == "")
                        $scope.ItemListGlobals.badlocation = true;
                }
            }

            if ($scope.ItemListGlobals.isFav == false) {
                $scope.openModal();
            }

            $scope.ItemListGlobals.isFav = false;

        }
        $scope.fntabFav = function() {
            if ($scope.ItemListGlobals.topClearanceItem == "clearance") {
                $scope.clearance = true;
            } else {
                $scope.clearance = null;
            }
            $scope.ItemListGlobals.selectedItem = {};
            $scope.ItemListGlobals.noMoreItemAvailable = true;
            $scope.ItemListGlobals.badlocation = false;
            $scope.itemList = "";
            $scope.ItemListGlobals.pageNumber = 0;
            $scope.ItemListGlobals.isFav = true;
            sqliteService.query("SELECT * FROM stores")
                .then(function(result) {
                    if (result.rows.length > 0) {
                        $scope.ItemListGlobals.storeids = [];
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            $scope.ItemListGlobals.storeids.push(row.storeNumber);
                        }
                        $scope.refineFlag = true;

                        $scope.loadMoreItems();

                    } else {
                        $scope.ItemListGlobals.total_items = 0;
                        $scope.itemList = "";
                    }


                });
          
        }
        $scope.redirecttoEbay = function() {
            var link = "http://m.ebay.com/sch/cashamerica/m.html?isRefine=true&_nkw=" + $scope.content.search_cat;
            var ref = window.open(link, '_blank', 'location=yes');

        }


        $scope.getFavItems = function(Icn, catcode) {
            $scope.refineDataToSend = {
                "UniqueId": deviceInfo.Uuid,
                "SearchTerm": null,
                "Stores": [],
                "CategoryCodes": [],
                "SearchPriceHigh": "2000",
                "SearchPriceLow": "10",
                "Longitude": $rootScope.longitude,
                "Latitude": $rootScope.Latitude,
                "SearchDistance": 100,
                "SearchPage": $scope.ItemListGlobals.pageNumber,
                "ResultsPerPage": "10",
                "OnlyClearanceItems": true
            };
            /* var deviceInfo = serviceApi.getDeviceInformation();
             if ($scope.refineFlag) {
                 if($scope.datatoRefine.maxPrice == null){
                      $scope.datatoRefine.maxPrice = $scope.maxPrice;
                 }else{
                      $scope.datatoRefine.maxPrice = $scope.datatoRefine.maxPrice;
                 }
                    if($scope.datatoRefine.minPrice == null){
                           $scope.datatoRefine.minPrice = $scope.minPrice;
                       }else{
                            $scope.datatoRefine.minPrice = $scope.datatoRefine.minPrice;
                 }
                 var datatosend = {
                         "UniqueId": deviceInfo.Uuid,
                         "SearchTerm": $scope.datatoRefine.refineSearch,
                         "Icns": Icn,
                         "CategoryCodes": $scope.selection,
                         "SearchPriceHigh": $scope.datatoRefine.maxPrice,
                         "SearchPriceLow": $scope.datatoRefine.minPrice,
                         "Longitude": $rootScope.longitude,
                         "Latitude": $rootScope.Latitude,
                         "SearchDistance":$scope.datatoRefine.range
                         };
                 } else {
                         var datatosend = {
                         "UniqueId": deviceInfo.Uuid,
                         "SearchTerm": $scope.searchterm,
                         "Icns": Icn,
                         "CategoryCodes": catcode,
                         "SearchPriceHigh": "9999.00",
                         "SearchPriceLow": "0",
                         "Longitude": $rootScope.longitude,
                         "Latitude": $rootScope.Latitude,
                         "SearchDistance":"1000"
                         };
                 }
                
             
             console.log("favorite data", datatosend);
             serviceApi.getFavoriteItems(datatosend)
                 .then(function (response) {
                     console.log("getFavoriteItems", response);
                     if (response == '204') {

                         $scope.itemList = '';
                         console.log("getFavoriteItems no content");
                         $scope.ItemListGlobals.isFav = true;
                         $scope.ItemListGlobals.total_items = 0;
                     }
                     else {
                         $scope.ItemListGlobals.total_items = response.numberItemsTotal;
                         if (response.results.length != 0) {
                             $scope.itemList = response.results;
                             $scope.ItemListGlobals.isFav = true;
                         }
                         else {
                             $scope.itemList = "";
                             $scope.ItemListGlobals.isFav = true;
                         }
                     }
                 },
                 function (err) {
                     console.log("error in getFavoriteItems");
                     
                 });*/
        }
        $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $scope.zipcode = {
                code: serviceApi.zipcode,
                city: serviceApi.city,
                abbreviation: serviceApi.state,
                stateindex: serviceApi.stateindex
            };
            $scope.restore = {
                code: serviceApi.zipcode,
                city: serviceApi.city,
                abbreviation: serviceApi.state,
                stateindex: serviceApi.stateindex
            };
            $scope.states = GENERAL_CONFIG.STATES;
            $scope.zipcode.state = $scope.states[serviceApi.stateindex];
            console.log(toState + " " + fromState.name)
            if (fromState.name == "app.stores") {
                $scope.fntabFav();
            }
        });

    }
})();