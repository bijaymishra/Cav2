(function () {
    'use strict';

    angular.module('starter').controller('menuContoller', ['$scope','$state', '$ionicModal','$ionicHistory','$ionicSideMenuDelegate', menuContoller]).directive('active', function() {
    return {
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                //Remove the active from all the child elements
                element.parent().children().removeClass('activated');
                
                //Add active class to the clicked buttong
                element.toggleClass('activated');
            })
        },
    }
});

    function menuContoller($scope,$state, $ionicModal,$ionicHistory,$ionicSideMenuDelegate) {
        var vm = this;

        $scope.redirectToEbay = function()
        {

            var ref = window.open('http://m.ebay.com/sch/cashamerica/m.html?isRefine=true', '_blank', 'location=yes');
        }
         $scope.redirectToNJS = function()
        {

            var ref = window.open('http://www.cashamerica.com/myjewelrycenter/index.html', '_blank', 'location=yes');
        }
        $scope.redirecttoStore = function()
        {
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            $state.go('app.stores' , {reload: true});
        }
        $scope.redirecttoSaveItems = function()
        {
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            $state.go('app.saveitems' , {reload: true});
        }

        $scope.closesideMenu = function()
        {
             $ionicSideMenuDelegate.toggleLeft();
        }
    };
	

})();



