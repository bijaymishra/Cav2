(function () {

    angular.module('starter').factory('responseInterceptor', ['$q', '$location', function ($q, $location, applicationLocalStorageService) {
        return {
            // On request success
            request: function (config) {
                return config || $q.when(config);
            },

            // On request failure
            requestError: function (rejection) {
                console.log(rejection); // Contains the data about the error on the request.

                // Return the promise rejection.
                return $q.reject(rejection);
            },

            response: function (response) {
                //console.log(response); // Contains the data from the response.    

                return response || $q.when(response);
            },

            // On response failture
            responseError: function (rejection) {
                console.log(rejection); // Contains the data about the error.

                if (rejection.status === 401) {

                    // Cleared cached token data. 
                    //applicationLocalStorageService.removeAll();

                    $location.path('/signin');
                }

                // Return the promise rejection.
                return $q.reject(rejection);
            }
        }
    }]);

    angular.module('starter').config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('responseInterceptor');
    }]);

})();