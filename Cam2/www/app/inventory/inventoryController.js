(function () {
    'use strict';

    angular.module('starter').controller('inventoryController', ['$scope', '$state', 'serviceApi', 'applicationLocalStorageService', 'commonHelper', '_', inventoryController]);

    function inventoryController($scope, $state, serviceApi, applicationLocalStorageService, commonHelper, _) {
        console.log('In inventory Controller');

        if (!applicationLocalStorageService.checkKey('ProductList')) {
            serviceApi.getProductList();
        }
        else {
            $scope.products = applicationLocalStorageService.getCache('ProductList');
            $scope.mainProducts = _.filter($scope.products, function (item) {
                return item.parentID == 0;

            });
        }

         $scope.loadproduct = function (product) {

            if (!product.hasChildren) {
                $scope.categoryDetail(product.categoryCode,product.categoryName);
                return;
            }else{
               $scope.selectedCategory = product.categoryCode; 
               console.log($scope.selectedCategory);
                var result = { itemcategoryCode: product.categoryCode,itemcategoryName:product.categoryName};
             $state.go('app.inventoryItem',result);
            }
         };

        $scope.toggleproduct = function (product) {
                console.log(product);
            if (!product.hasChildren) {
                $scope.categoryDetail(product.categoryCode,product.categoryName);
                return;
            }
             console.log($scope.isproductShown(product));
            if ($scope.isproductShown(product)) {
                $scope.shownProduct = null;
            } else {
                $scope.shownProduct = product;

            }
        };

        $scope.isproductShown = function (product) {
            return $scope.shownProduct === product;
        };

        $scope.categoryDetail = function (categoryId,categoryName) {
            var result = { categoryCode: categoryId, searchterm: '',categoryName:categoryName, from: 'itemlist' };
            $state.go('app.itemList', result);
        }
        $scope.searchGlobal = function(searchtext) {
             if(searchtext!=undefined && searchtext.length>1)
            {
                var result = { categoryCode: 0, searchterm: searchtext,categoryName:'' };
                $state.go('app.itemList', result);
            }
        }
        $scope.searchEnter = function(event,searchtext)
        {
            if (event.keyCode == 13 || event.keyCode == 10){
                $scope.searchGlobal(searchtext);
            }
        }
        $scope.keyPress = function(keyCode,search){
           if (keyCode == 13 || keyCode == 10){
                $scope.searchGlobal(search);
            }
        }
    }
})();