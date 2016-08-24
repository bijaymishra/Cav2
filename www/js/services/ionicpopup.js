angular.module('healthApp.services')
    .factory('SecuredPopups', [
        '$ionicPopup',
        '$q',
        function($ionicPopup, $q) {

            var firstDeferred = $q.defer();
            firstDeferred.resolve();

            var lastPopupPromise = firstDeferred.promise;

            return {
                'show': function(method, object) {
                    var deferred = $q.defer();

                    lastPopupPromise.then(function() {
                        $ionicPopup[method](object).then(function(res) {
                            deferred.resolve(res);
                        });
                    });

                    lastPopupPromise = deferred.promise;

                    return deferred.promise;
                },
                'showConditional' : function(method, object, condition){
                    var deferred = $q.defer();

                    lastPopupPromise.then(function() {
                        if (condition()){
                            $ionicPopup[method](object).then(function(res) {
                                deferred.resolve(res);
                            });
                        } else {
                            deferred.resolve(false);
                        }
                        
                    });

                    lastPopupPromise = deferred.promise;

                    return deferred.promise;
                }
            };
        } 
    ]);