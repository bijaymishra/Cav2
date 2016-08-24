(function () {
    'use strict';

    angular.module('starter').controller('inventoryItemController', ['$scope','$state', 'serviceApi', 'applicationLocalStorageService', 'commonHelper','$stateParams', '_', inventoryItemController]);

    function inventoryItemController($scope, $state, serviceApi, applicationLocalStorageService, $stateParams, commonHelper, _) {
        console.log('In inventory Controller');
 $scope.itemcategoryCode = $state.params.itemcategoryCode;
 $scope.itemcategoryName = $state.params.itemcategoryName;
 $scope.flag = false;
 //console.log($stateParams.itemcategoryCode);
        if (!applicationLocalStorageService.checkKey('ProductList')) {
            serviceApi.getProductList();
        }
        else {
            $scope.flag = true;
            $scope.products = applicationLocalStorageService.getCache('ProductList');
            
        }

        
        $scope.categoryDetail = function (categoryId,categoryName) {
            var result = { categoryCode: categoryId, searchterm: '',categoryName:categoryName, from: 'itemlist' };
            $state.go('app.itemList', result);
        }
        $scope.searchGlobal = function(searchtext) {
             if(searchtext!=undefined && searchtext.length>1)
            {
                var result = { categoryCode: $scope.itemcategoryCode , searchterm: searchtext,categoryName:'' };
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