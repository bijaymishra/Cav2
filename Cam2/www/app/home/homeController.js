(function () {
    'use strict';

    angular.module('starter').controller('homeController', ['$scope', '$rootScope', '$ionicPopup', '$state','$ionicPlatform', 'serviceApi', 'geolocationService', 'applicationLocalStorageService', '$ionicSlideBoxDelegate', 'commonHelper', 'sqliteService', 'GENERAL_CONFIG', homeController]);

    function homeController($scope, $rootScope, $ionicPopup, $state,$ionicPlatform, serviceApi, geolocationService, applicationLocalStorageService, $ionicSlideBoxDelegate, commonHelper, sqliteService, GENERAL_CONFIG) {
        //$scope.isIntroDone = $scope.isIntroOn = false;
        console.log('in home controller');
        //var isLogin = localStorage.getItem('isLogin');
        //if (typeof isLogin !== 'undefined' && isLogin !== null) {
        //    $state.go('app.banner');
        //}

        var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
        if (iOS) {
            if (navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d/i)) {
                document.getElementsByTagName('body')[0].className = 'platform-ios';
            }
        }

        $scope.textMsgSavings = {};
        $rootScope.termstext = "";
        $scope.userName = '';
        // An elaborate, Terms popup

        

        //$rootScope.termsDialog = function () {
        //    $rootScope.data = {}

        //    var myPopup = $ionicPopup.show({
        //        // template: '',
        //        // title: 'Terms',
        //        subTitle: $rootScope.termstext,
        //        scope: $rootScope,
        //        buttons: [
        //          { text: 'Close' },

        //        ]
        //    });
        //    myPopup.then(function (res) {
        //        // console.log('Tapped!', res);
        //    });
        //}
         

   
        $scope.fnConnectFB = function () {
            facebookConnectPlugin.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    var uid = response.authResponse.userID;
                    var accessToken = response.authResponse.accessToken;
                    applicationLocalStorageService.storeCache('token', accessToken);
                    facebookConnectPlugin.login(["email"], function (response) {
                        if (response.authResponse) {
                            facebookConnectPlugin.api('/me', null,
                                function (response) {

                                    applicationLocalStorageService.storeCache('username', response.name);
                                    applicationLocalStorageService.storeCache('email', response.email);
                                    applicationLocalStorageService.storeCache('gender', response.gender);
                                    $state.go('facebook');
                                });

                        }
                    });

                } else if (response.status === 'not_authorized') {

                } else {

                    facebookConnectPlugin.login(["email"], function (response) {
                        if (response.authResponse) {
                            var accessToken = response.authResponse.accessToken;
                    applicationLocalStorageService.storeCache('token', accessToken);
                            facebookConnectPlugin.api('/me', null,
                                function (response) {

                                    applicationLocalStorageService.storeCache('username', response.name);
                                    applicationLocalStorageService.storeCache('email', response.email);
                                    applicationLocalStorageService.storeCache('gender', response.gender);
                                    $state.go('facebook');
                                });

                        }
                    });
                }
            },
            function (error) {
                alert("" + error)
            });
        };
       
        $scope.states = GENERAL_CONFIG.STATES;

        //$scope.skipBanners = function () {
        //    //localStorage.setItem('skippBanner', true);
        //    //$state.go('home');
        //    sqliteService.query('SELECT * FROM generic where key = "IsIntroSkipVersion"').then(function (result) {
        //        //if record already exits then update with new version else insert new record.
        //        if (result.rows.length > 0) {
        //            sqliteService.query("UPDATE GENERIC SET value = '" + GENERAL_CONFIG.APP_VERSION + "' WHERE KEY = 'IsIntroSkipVersion'");
        //        }
        //        else {
        //            sqliteService.query("INSERT INTO GENERIC(key,value) VALUES ('IsIntroSkipVersion','" + GENERAL_CONFIG.APP_VERSION + "')");
        //        }
        //        $scope.isIntroDone = true;
        //        $scope.isIntroOn = false;
        //    });
        //}


        $scope.init = function () {
            /*$ionicPlatform.ready( function() { 
            serviceApi.getConfig().then(function(response) {
            console.log(response);
             GENERAL_CONFIG.GA_enabled = response.gA_enabled;
            console.log(GENERAL_CONFIG.GA_enabled);
            sqliteService.query('SELECT * FROM generic where key = "API_VERSION"').then(function (result) {
                //if record already exits then update with new version else insert new record.
                if (result.rows.length > 0) {
                   if(result.rows[0].value!=GENERAL_CONFIG.API_VERSION)
                   {
                       alert("Please install updated version.");
                   }
                }
                else {
                    sqliteService.query("INSERT INTO generic(key,value) VALUES ('API_VERSION','" + response.apI_maxVersion + "')");
                   
                }
            }, function (error) {
                console.log('not exits');
            });
        });
        });*/
        }

        function init() {
            console.log('init load event');
        }

        $scope.$on('$ionicView.loaded', function () {
            $scope.init();
        });

        $scope.$on('$viewContentLoading', function (event, viewConfig) {
            // Access to all the view config properties.
            // and one special property 'targetView'
            // viewConfig.targetView 
            console.log('contentloading');
        });
    }
})();
