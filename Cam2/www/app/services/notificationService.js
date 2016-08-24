(function () {
    'use strict';

    angular.module('starter').factory('notificationService', ['$http', '$q', '$rootScope', 'serviceApi', '$ionicLoading', '$cordovaDevice', 'applicationLocalStorageService', 'GENERAL_CONFIG', 'commonHelper', notificationService]);

    function notificationService($http, $q, $rootScope, serviceApi, $ionicLoading, $cordovaDevice, applicationLocalStorageService, GENERAL_CONFIG, commonHelper) {

        /*-------------------Android Start------------------------*/

        function androidSuccessHandler(result) {
            console.log("Android token handler" + result);
            serviceApi.saveDeviceNotificationToken(result);
        };

        function androidErrorHandler(error) {
            alert("Android error handler" + error);
        };

        /*-------------------Android End------------------------*/

        /*-------------------iOS Start------------------------*/

        function tokenHandler(result) {
            //console.log(result);
            console.log('device token - ' + result);

            serviceApi.saveDeviceNotificationToken(result);
        };

        function errorHandler(error) {
            alert('Register Error = ' + error);
        };

        function iosUnregisterSuccessHandler(result) {
            //console.log(result);
            console.log('device token - ' + result);

            serviceApi.saveDeviceNotificationToken('');
        };

        function iosUnregisterErrorHandler(error) {
            alert('Unregister Error = ' + error);
        };

        function onNotificationAPN(event) {
            console.log(event);
            if (event.alert) {
                navigator.notification.alert(event.alert);
            }

            if (event.sound) {
                var snd = new Media(event.sound);
                snd.play();
            }

            if (event.badge) {
                $rootScope.pushNotification.setApplicationIconBadgeNumber(vm.iosBadgeSuccessHandler, vm.iosBadgeErrorHander, event.badge);
            }
        };

        function iosBadgeErrorHander(error) {
            alert("iosBadgeErrorHander - " + error);
        };

        function iosBadgeSuccessHandler(result) {
            alert("iosBadgeSuccessHandler - " + result);
        };

        /*-------------------iOS End------------------------*/

        return {
            //Unregister device for notification
            unregisterDevice: function () {
                console.log('unregisterDevice - ' + device.platform)
                if (device.platform === 'iOS') {
                    $rootScope.pushNotification.unregister(iosUnregisterSuccessHandler, iosUnregisterErrorHandler, null);
                }
            },

            //Register device for notification
            registerDevice: function () {
                var device = commonHelper.getDeviceInformation();

                //Platform-specific registrations.
                if (device.platform == 'android' || device.platform == 'Android') {
                    // Register with GCM for Android apps.
                    $rootScope.pushNotification.register(
                                              androidSuccessHandler,
                                              androidErrorHandler,
                                              {
                                                  "senderID": GCM_SENDER_ID,
                                                  "ecb": "onNotificationGCM"
                                              });
                } else if (device.platform === 'iOS') {
                    // Register with APNS for iOS apps.
                    $rootScope.pushNotification.register(
                                           tokenHandler,
                                           errorHandler, {
                                               "badge": "true",
                                               "sound": "true",
                                               "alert": "true",
                                               "ecb": "onNotificationAPN"
                                           });
                }
            }
        };
    }
})();