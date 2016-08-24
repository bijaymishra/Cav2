(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SynchronizeCtrl($scope, $rootScope, $state, $stateParams, $q, UserResourceDB, QueueDB, Synchronizer, SecuredPopups, AppResourceDB) {

        /**
         * Select Initial Data Loading Message based on if user is logging in for first time or second time
         */
        function _selectInitiatDataLoadingMessage(userId) {
            var deferred = $q.defer();
            if ($scope.isLogin) {
                UserResourceDB.getByType($rootScope.user.userId, 'notification')
                    .then(function(data) {
                        $scope.isLoading = true;
                        $scope.loadingMessage = data ? $rootScope.Messages.SUBSEQ_LOADING_MESSAGE : $rootScope.Messages.INITIAL_LOADING_MESSAGE;
                    }).then(deferred.resolve);
            } else {
                $scope.loadingMessage = $rootScope.Messages.SYNC_LOADING_MESSAGE;
                deferred.resolve(true);
            }
            return deferred.promise;
        }

        function _clean() {
            var deferred = $q.defer();
            if (!$scope.isLogin) {
                Synchronizer.CleanDb()
                    .then(deferred.resolve)
                    .catch(deferred.reject);
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        }

        function _synchronize() {
            QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) {
                        return Synchronizer.SyncQueue();
                    }
                }).then(function() {
                    if ($rootScope.SyncError) {
                        return SecuredPopups.show('alert', {
                            title: $rootScope.Messages.MESSAGE_TITLE,
                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR
                        }).then(function() {
                            $state.transitionTo('login');
                        });
                    } else {
                        return _clean().then(Synchronizer.SyncOrgResources)
                            .then(Synchronizer.SyncUserResources)
                            .then(function() {
                                if ($scope.isLogin) {
                                    return Synchronizer.InitializeBackgroundSynchronizer();
                                }
                            }).then(function() {
                                if ($scope.isLogin) {
                                    return UserResourceDB.getByType($rootScope.user.userId, "appAccessed")
                                            .then(function(data) {
                                                if (data) {
                                                    $state.transitionTo('app.quickAction');
                                                } else {
                                                    $state.transitionTo('intro');
                                                }
                                            });
                                } else {
                                    $state.transitionTo('app.quickAction');
                                    return null;
                                }
                            }).then(function() {
                                return AppResourceDB.getByType("lastUser").then(function(data) {
                                    data = data || {};
                                    data.resourceType = "lastUser";
                                    data.resource = $rootScope.user.name;
                                    data.timeStamp = new Date();
                                    return AppResourceDB.AddOrUpdate(data);
                                });
                            });
                    }
                })
                .catch(function(e) {
                    SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.RELOGIN_MESSAGE 
                    }).then(function() {
                        $state.transitionTo('login');
                    });
                });
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            $scope.loadingMessage = "";
            $scope.isLogin = $stateParams.isLogin === 'true';
            _selectInitiatDataLoadingMessage($rootScope.user.userId)
                .then(_synchronize);
        }

        onInit();
    }

    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    SynchronizeCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$q',
        'UserResourceDB', 'QueueDB', 'Synchronizer', 'SecuredPopups', 'AppResourceDB'
    ];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('SynchronizeCtrl', SynchronizeCtrl);

}());