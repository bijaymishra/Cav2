(function () {
    'use strict';

    angular.module('starter').controller('bannerController', ['$scope','$rootScope','$ionicPlatform', '$state','GENERAL_CONFIG', 'geolocationService', 'globalsearchService', 'serviceApi', 'applicationLocalStorageService', 'commonHelper', '$ionicSlideBoxDelegate', 'sqliteService','$ionicHistory','$ionicPopup', '$cordovaGoogleAnalytics', '$ionicSideMenuDelegate','$timeout', bannerController]);
    function bannerController($scope, $rootScope,$ionicPlatform, $state,GENERAL_CONFIG, geolocationService, globalsearchService, serviceApi, applicationLocalStorageService, commonHelper, $ionicSlideBoxDelegate, sqliteService,$ionicHistory,$ionicPopup,$cordovaGoogleAnalytics, $ionicSideMenuDelegate,$timeout) {

        $ionicSideMenuDelegate.canDragContent(false);
        $scope.loadClearance = true;
        $scope.showSlider = false;
        //$scope.banners = [{"offerID":'',"imageURL":""},{"offerID":'',"imageURL":""}];
        if (!applicationLocalStorageService.checkKey('BannerList')) {
            serviceApi.getBanners();
        }
        else {
            $scope.banners = applicationLocalStorageService.getCache('BannerList');
        }

        console.log('In banner Controller');
        $scope.redirectToPromoDetail = function (promoId) {
            console.log('in redirectToPromoDetail');
            $state.go('app.promotionDetail', { promoId: promoId });
        }
        $scope.SearchOn = false;
        $scope.data = { "recentdata": [], "search": '' };

        $scope.search = function () {
            $scope.SearchOn = true;
            globalsearchService.searchrecent($scope.data.search).then(
                function (matches) {
                    $scope.data.recentdata = matches;
                }
            )
        }
        $scope.CloseSearch = function () {
            $scope.SearchOn = false;
        }
        if (!applicationLocalStorageService.checkKey('TopCategorylist')) {
            serviceApi.getTopCategory();
        }
        else {
            $scope.topCategory = applicationLocalStorageService.getCache('TopCategorylist');
            
        }
        

        $scope.$on('$ionicView.enter', function () {
            $rootScope.activeSearchSlide = 0;
             $ionicSideMenuDelegate.canDragContent(false);
            $ionicSlideBoxDelegate.update();
            $timeout(function() {
                  $ionicSlideBoxDelegate.select(0,1);
                  $ionicSlideBoxDelegate.start(0,100);             
                },20);

             if (!applicationLocalStorageService.checkKey('ProductList')) {
            serviceApi.getProductList();
          }
        else {
            $scope.products = applicationLocalStorageService.getCache('ProductList');
            $scope.mainProducts = _.filter($scope.products, function (item) {
                return item.parentID == 0;

            });
        }

        });
        
        $ionicPlatform.ready( function() {
        if ($rootScope.Latitude == "" && $rootScope.longitude == "" || $rootScope.Latitude == undefined && $rootScope.longitude == undefined ) {
            geolocationService().then(function (position) {
                $scope.position = position;
                console.log(position.coords.latitude);
                $rootScope.Latitude = position.coords.latitude;
                $rootScope.longitude = position.coords.longitude;

            }, function (error) {
                var zipcode = localStorage.getItem('Zipcode');
                var zipcodenew = localStorage.getItem('zipcode');
                if (typeof zipcode !== 'undefined' && zipcode !== null) {
                       $scope.updateZipcode(zipcode);
                 }
                  else if(typeof zipcodenew !== 'undefined' && zipcodenew !== null)
                  {
                    $scope.updateZipcode(zipcodenew);
                  
                  }
                  
            });
        }
        $scope.$on('$ionicView.loaded',function() {
            serviceApi.getConfig().then(function(response) {
            console.log(response);
             GENERAL_CONFIG.GA_enabled = response.gA_enabled;
             console.log(GENERAL_CONFIG.GA_enabled);
             if(window.cordova)
             {
               if(GENERAL_CONFIG.GA_enabled == true || GENERAL_CONFIG.GA_enabled == "true")
                {
                    $cordovaGoogleAnalytics.trackView("Home");
                }
             }
             if(GENERAL_CONFIG.API_VERSION <= response.apI_maxVersion && GENERAL_CONFIG.API_VERSION>=response.apI_minVersion)
             {
               
             }
             else
             {
                 var myPopup = $ionicPopup.show({
                    subTitle: "Please install the updated version of app.",
                     scope: $scope,
                     buttons: [{ text: 'Ok' ,
                     onTap: function(e) {
                        navigator.app.exitApp();
                     }
                 }]
                 });
             }
            /*sqliteService.query('SELECT * FROM generic where key = "API_VERSION"').then(function (result) {
                //Check the api max version .
                if (result.rows.length > 0) {
                   if(result.rows[0].value!=GENERAL_CONFIG.API_VERSION)
                   {
                       //alert("Please install updated version.");
                    
                   }
                }
                else {
                    sqliteService.query("INSERT INTO generic(key,value) VALUES ('API_VERSION','" + response.apI_maxVersion + "')");
                   
                }
            }, function (error) {
                console.log('not exits');
            });*/
        });
        
        });
        });
         $scope.updateZipcode = function(zipcode)
        {
                serviceApi.getUpdatedLocation(zipcode)
                           .then(function (response) {
                            if(response.results.length>0)
                            {
                               $rootScope.Latitude = response.results[0].geometry.location.lat;
                               $rootScope.longitude = response.results[0].geometry.location.lng;
                           }
                           else
                           {
                            $rootScope.Latitude = "";
                            $rootScope.longitude = "";
                           }
                           },
                       function (err) {

                       });
                        serviceApi.zipcode = zipcode; 
        
        }
        $scope.redirectToEbay = function () {

            var ref = window.open('http://m.ebay.com/sch/cashamerica/m.html?isRefine=true', '_blank', 'location=yes');
        }
        $scope.redirectToNJS = function () {

            var ref = window.open('http://www.cashamerica.com/myjewelrycenter/index.html', '_blank', 'location=yes');
        }

        $scope.searchGlobal = function (searchtext) {
            if (searchtext != "" && searchtext.length>1) {
                var found = false;
                var rdata = localStorage.getItem('recentdata');
                if (typeof rdata !== 'undefined' && rdata !== null) {
                    var retrievedData = localStorage.getItem("recentdata");
                    $rootScope.recentdata = JSON.parse(retrievedData);
                    for (var i = 0; i < $rootScope.recentdata.length; i++) {
                        if ($rootScope.recentdata[i].name == searchtext) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        $rootScope.recentdata.push({ name: searchtext });
                        if ($rootScope.recentdata.length > 5) {
                            $rootScope.recentdata.shift();
                        }
                    }
                    localStorage.setItem('recentdata', JSON.stringify($rootScope.recentdata));
                }
                else {
                    $rootScope.recentdata.push({ name: searchtext });
                    localStorage.setItem('recentdata', JSON.stringify($rootScope.recentdata));
                }
                var result = { categoryCode: 0, searchterm: searchtext, categoryName: '' };
                $scope.data.search = searchtext;
                $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
                $state.go('app.itemList', result);
            }
        }
        $scope.keyPress = function (keyCode, search) {
            //$scope.search();
            if (keyCode == 13 || keyCode == 10) {
                $scope.searchGlobal(search);
            }
        }
        $scope.categoryDetail = function (categoryId, categoryName) {
            var result = { categoryCode: categoryId, searchterm: '', categoryName: categoryName, from: 'itemlist' };
            $state.go('app.itemList', result);
        }
        $scope.catClearanceDetail = function (clearance) {
            var result = { categoryCode: [], searchterm: null, categoryName: 'Clearance', from: clearance };
            $state.go('app.itemList', result);
        }
        $scope.$on('$ionicView.beforeLeave', function () {
             $ionicSideMenuDelegate.canDragContent(true);
        });
       
        $scope.redirecttostores = function()
        {
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            $state.go('app.stores' , {reload: true});
        }
        $scope.$watch(function () {
            return $ionicSideMenuDelegate.getOpenRatio();
          },
         function (ratio) {
                  if (ratio == 1){
                   $ionicSideMenuDelegate.canDragContent(true);
                  }
                  else
                  {
                    $ionicSideMenuDelegate.canDragContent(false);
                  }
                });
    }
})();