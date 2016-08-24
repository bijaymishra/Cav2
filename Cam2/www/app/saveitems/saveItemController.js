(function() {
    'use strict';

    angular.module('starter').controller('saveItemController', ['$scope', '$rootScope', '$state', 'serviceApi', 'applicationLocalStorageService', 'sqliteService', 'GENERAL_CONFIG', saveItemController]);

    function saveItemController($scope, $rootScope, $state, serviceApi, applicationLocalStorageService, sqliteService, GENERAL_CONFIG) {
        console.log('In save item Controller');
        var output = [];
        // saved item object
        $scope.savedItem = {
            Icns : [],
            SearchTerm : null,
            selectedItem : {},
            total_items : 0,
            itemList : '',
            itemdata : false
        }

        var deviceInfo = serviceApi.getDeviceInformation();
        // check if any item has been saved
        sqliteService.query("SELECT * FROM items")
            .then(function(result) {
                output = [];

                for (var i = 0; i < result.rows.length; i++) {
                    var row = result.rows.item(i);
                    var obj = {
                        longICN: row.longICN,
                        favorite: row.favorite,
                        categoryCode: row.categoryCode,
                    };
                    output.push(obj);

                    if (row.favorite == "true")
                        $scope.savedItem.selectedItem[row.longICN] = true;
                }

                $scope.savedItem.Icns = [];
                if (output.length != 0) {
                    $scope.getSavedItem();
                } else {
                    $scope.savedItem.itemList = '';
                    $scope.savedItem.itemdata = true;
                }
            });

        /* Tap on item redirect to store detail page*/
        $scope.redirectToStoreDetail = function(storeId, item, type) {
            $state.go('app.storeDetail', {
                storeId: storeId,
                from: 'product'
            });
        }
        /* Add remove favorite items */
        $scope.addRemoveFavorite = function(id, item) {
            $scope.products = applicationLocalStorageService.getCache('ProductList');
            $scope.mainProducts = _.find($scope.products, function(val) {
                return val.categoryCode == $scope.categoryId;
            });
            if ($scope.savedItem.selectedItem[item.longICN]) {
                $scope.savedItem.selectedItem[id] = false;
                sqliteService.query('DELETE from items WHERE longICN="' + item.longICN + '"');
                sqliteService.query("SELECT * FROM items")
                    .then(function(result) {
                        output = [];
                        for (var i = 0; i < result.rows.length; i++) {
                            var row = result.rows.item(i);
                            var obj = {
                                longICN: row.longICN,
                                favorite: row.favorite,
                                categoryCode: row.categoryCode,
                            };
                            output.push(obj);
                            if (row.favorite == "true")
                                $scope.savedItem.selectedItem[row.longICN] = true;
                        }
                        $scope.savedItem.Icns = [];
                        $scope.getSavedItem();
                    });

            } else {
                $scope.savedItem.selectedItem[id] = true;
                sqliteService.query("INSERT INTO items (itemName,longICN,details,price,distance,storeNumber,shortName,favorite,isAvailable,categoryCode) VALUES ('" + item.itemName + "','" + item.longICN + "','" + item.details.toString() + "','" + item.price + "','" + item.distance + "','" + item.storeNumber + "','" + item.shortName + "','" + true + "','" + item.isAvailable + "','" + item.categoryId + "')");

            }
        };
        /* getSavedItem using the long icns, and default values*/
        $scope.getSavedItem = function() {
            $scope.savedItem.soldIcns = [];
            $scope.savedItem.notSoldIcns = [];
            angular.forEach(output, function(value, key) {
                $scope.savedItem.Icns.push(output[key].longICN);
            });
            var datatosend = {
                "UniqueId": deviceInfo.Uuid,
                "SearchTerm": $scope.savedItem.SearchTerm,
                "Icns": $scope.savedItem.Icns,
                "CategoryCodes": [],
                "SearchPriceHigh": GENERAL_CONFIG.SearchPriceHigh,
                "SearchPriceLow": GENERAL_CONFIG.SearchPriceLow,
                "Longitude": $rootScope.longitude,
                "Latitude": $rootScope.Latitude,
                "SearchDistance": GENERAL_CONFIG.SearchDistance
            }
            console.log("favorite data", datatosend);
            serviceApi.getFavoriteItems(datatosend)
                .then(function(response) {
                        console.log("getFavoriteItems", response);
                        if (response == '204') {
                            $scope.savedItem.itemList = '';
                            $scope.savedItem.itemdata = true;
                            $scope.savedItem.total_items = 0;
                        } else {
                            $scope.savedItem.itemList = _.filter(response.results, function(item) {
                                return item.isAvailable == true;
                            });
                            $scope.savedItem.total_items = response.numberItemsTotal;
                            if (response.results.length != 0) {

                                for (var i = 0; i < response.results.length; i++) {
                                    var row = response.results[i];
                                    var obj = {
                                        longICN: row.longICN,
                                        favorite: row.favorite,
                                        categoryCode: row.categoryCode,
                                        isAvailable: row.isAvailable,
                                    };
                                    output.push(obj);
                                }

                                angular.forEach(output, function(value, key) {
                                    if (output[key].isAvailable == false) {
                                        $scope.savedItem.soldIcns.push(output[key].longICN);
                                    }
                                });
                                angular.forEach(output, function(value, key) {
                                    if (output[key].isAvailable == true) {
                                        $scope.savedItem.notSoldIcns.push(output[key].longICN);
                                    }
                                });

                                for (var i = 0; i < $scope.savedItem.soldIcns.length; i++) {
                                    sqliteService.query('SELECT * FROM items WHERE longICN="' + $scope.savedItem.soldIcns[i] + '"')
                                        .then(function(result) {
                                            output = [];
                                            for (var i = 0; i < result.rows.length; i++) {
                                                if (result.rows.length > 0) {
                                                    var row = result.rows.item(i);
                                                    var obj = {
                                                        itemName: row.itemName,
                                                        longICN: row.longICN,
                                                        details: row.details.split(','),
                                                        price: row.price,
                                                        distance: row.distance,
                                                        categoryDesc: row.categoryDesc,
                                                        categoryCode: row.categoryCode,
                                                        isAvailable: false,
                                                        isClearanceItem: row.isClearanceItem,
                                                        storeNumber: row.storeNumber,
                                                        shortName: row.shortName,
                                                    };

                                                    output.push(obj);
                                                }

                                            }
                                            $scope.savedItem.itemList = $scope.savedItem.itemList.concat(output);
                                        });
                                    $scope.savedItem.itemdata = false;
                                }
                            } else {
                                $scope.savedItem.itemList = "";
                                $scope.savedItem.itemdata = true;
                            }
                        }
                    },
                    function(err) {
                        $scope.savedItem.itemList = '';
                        $scope.savedItem.itemdata = true;
                    });
        };
    }
})();