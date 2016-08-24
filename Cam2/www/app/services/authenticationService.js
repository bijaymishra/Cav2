(function () {
    'use strict';

    angular.module('starter').factory('authenticationService', ['$http', '$q', '$cordovaDevice', '$ionicLoading', 'applicationLocalStorageService', 'GENERAL_CONFIG', authenticationServie]);

    function authenticationServie($http, $q, $cordovaDevice, $ionicLoading, applicationLocalStorageService, GENERAL_CONFIG) {

        // To check is token active.
        function isTokenActive() {
            var deferred = $q.defer();

            var userData = applicationLocalStorageService.getToken();

            if (userData) {
                console.log("Found user data ", userData);

                var response = userData;
                // resolved and pass data 
                deferred.resolve(response);
            }
            else {
                var error = "No token found";
                deferred.reject(error);
            };

            // Return data 
            return deferred.promise;
        };


        // To validate login data. 
        // @User
        function validateLogin(user) {

            var deferred = $q.defer();

            var userData = applicationLocalStorageService.getToken();

            if (userData) {
                console.log("Found user data ", userData);

                var response = userData;
                // resolved and pass data 
                deferred.resolve(response);
            }
            else {
                console.log("not found data");

                if (!user) return '';

                var tokenKey = 'accessToken';
                var serviceBase = GENERAL_CONFIG.API_URL;
                //var data = "grant_type=password&username=" + user.username + "&password=" + user.password;

                // Get device id 
                var uuid = '';
                if (ionic.Platform.isIOS.name != '') {
                    // Get device information 
                    uuid = $cordovaDevice.getUUID();
                }
                else {
                    // for brower only. where device information is null. 
                    uuid = GENERAL_CONFIG.DEFAULT_UUID;
                }
                var clientId = user.username + "_" + uuid;
                var data = "grant_type=password&username=" + user.username + "&password=" + user.password + "&client_id=" + clientId + "&client_secret=" + uuid;

                busyCursorStart();

                $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(
                function (response) {

                    // Store token in cached. 
                    applicationLocalStorageService.setToken(response);

                    busyCursorEnd();

                    deferred.resolve(response);

                }).error(function (error, status) {
                    console.log("error " + error);
                    busyCursorEnd();

                    deferred.reject(error);
                });
            };

            // Return data 
            return deferred.promise;
        };

        function busyCursorStart() {
            $ionicLoading.show({
                template: 'Loading...'
            });
        };

        function busyCursorEnd() {

            $ionicLoading.hide();
        };

        function logout(user) {
            console.log("logout ");

            applicationLocalStorageService.removeToken();

        };

        // Public method expose for outside. 
        return {
            validateLogin: validateLogin,
            logout: logout,
            isTokenActive: isTokenActive,
        };
    };

})();



