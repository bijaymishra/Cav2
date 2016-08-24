(function () {
    'use strict';

    angular.module('starter').controller('introController', ['$scope', '$state','serviceApi', 'applicationLocalStorageService', '$ionicSlideBoxDelegate', 'sqliteService', 'GENERAL_CONFIG', introController]);

    function introController($scope, $state,serviceApi, applicationLocalStorageService, $ionicSlideBoxDelegate, sqliteService, GENERAL_CONFIG) {

       

        $scope.skipBanners = function () {

              localStorage.setItem('skippBanner', true);
             var tcaccept = localStorage.getItem('TCAccept');
             if (typeof tcaccept !== 'undefined' && tcaccept !== null) {
                    localStorage.setItem("isLogin", "true");
                    $state.go('app.banner');
                }
                else
                {
                $state.go('home');
                }
            //sqlite not working on run time
            /*sqliteService.query('SELECT * FROM generic where key = "IsIntroSkipVersion"').then(function (result) {
                //if record already exits then update with new version else insert new record.

                if (result.rows.length > 0) {
                    sqliteService.query("UPDATE generic SET value = '" + GENERAL_CONFIG.APP_VERSION + "' WHERE KEY = 'IsIntroSkipVersion'");
                    //$state.go('home');
                }
                else {
                    sqliteService.query("INSERT INTO generic(key,value) VALUES ('IsIntroSkipVersion','" + GENERAL_CONFIG.APP_VERSION + "')");
                    //$state.go('home');
                }
            }, function (error) {
                console.log('not exits');
            });*/
           
        }

        function init() {
            //Match the current version with saved and display intro screens
            /*sqliteService.query('SELECT * FROM generic where key = "IsIntroSkipVersion"').then(function (result) {
                if ((result.rows.length > 0 && GENERAL_CONFIG.APP_VERSION != result.rows[0].value)
                    || (result.rows.length == 0)) {
                    $ionicSlideBoxDelegate.update();
                }
                else {
                   // $state.go('app.banner');
                }
            });*/
             var skip = localStorage.getItem('skippBanner');
                if (typeof skip !== 'undefined' && skip !== null) {
                     $state.go('home');
                }            

        }
         $scope.$on('$ionicView.enter', function () {
                $ionicSlideBoxDelegate.update();
                init();
            });
       
    }
})();