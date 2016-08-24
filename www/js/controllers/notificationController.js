(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function NotificationsCtrl($scope, $rootScope,
        $ionicListDelegate, $ionicPopup, $timeout, $window, $filter,
        Synchronizer, PostService, UserResourceDB, SecuredPopups) {


        function IsOnline() {
            if ($window.cordova) {
                return ($window.navigator.connection.type !== $window.Connection.NONE);
            } else {
                return $window.navigator.onLine;
            }
        }

        
        /**
         * Load Notifications from Database
         */
        function loadNotificationFromDB() {
            return UserResourceDB.getByType($rootScope.user.userId, 'notification')
                .then(function(data) {
                    $scope._notifications = JSON.parse(data.resource)
                        .map(function(item) {
                            return {
                                id: item.id,
                                message: item.message,
                                created: moment(item.created).format('MM/DD/YYYY    hh:mm A'),
                                _created: new Date(moment(item.created).format('MM/DD/YYYY    hh:mm A'))
                            };
                        });
                    $scope._notifications = $filter('orderBy')($scope._notifications, '_created');
                    $scope.notifications = [];
                    $scope.displayMessage = true;
                    $scope.loadMoreData();
                });
        }

        $scope.loadMoreData = function() {
            for (var i = 0; i <= 30; i++) {
                if ($scope._notifications.length > 0){
                    var item = $scope._notifications.pop();
                    $scope.notifications.push(item);
                }
            }
            $scope.moredata = $scope._notifications.length > 0;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        };

        /**
         * Event Handler for Refresh Events
         * If User is Online
         *     Synchronizes Notifications and Load it from Database
         * Else
         *     Provide a Message to User, Notificiations cannot be Synchronized as App is Offline
         */
        function onDoRefresh() {
            if ($scope.stopNavigation){
                return;
            }

            $scope.stopNavigation = true;
            $timeout(function() {
                if (IsOnline()) {
                    Synchronizer.SyncNotifications()
                        .then(function() {
                            return loadNotificationFromDB()
                                .then(function() {
                                    $scope.$broadcast('scroll.refreshComplete');
                                    $scope.stopNavigation = false;
                                });
                        })
                        .catch(function(e){
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.stopNavigation = false;
                            SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.SYNC_FAIL_MESSAGE
                            });
                        });
                } else {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.stopNavigation = false;
                    SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.SYNC_NOTIF_OFF_MESSAGE
                    });

                }
            }, 500);
        }

        /**
         * Handle delete requests
         * @param  {Notification} n Notification to be deleted
         */
        function onDelete(n, index) {
            if ($scope.stopNavigation){
                return;
            }

            var deleteConfirmPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELET_NOTIF_MESSAGE

            }).then(function(res) {
                if (res) {
                    PostService.DeleteNotification(n).then(function(updatedNotifications) {
                        // $scope.notifications = updatedNotifications;
                        $scope.notifications.splice(index, 1);
                        $ionicListDelegate.closeOptionButtons();
                    });
                }
            });
        }
        /**
         * Handles delete all notifications requests
         */
        function onDeleteAll() {
            /* $ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.DELETE_NOTIF_TITLE,
                template: $rootScope.Messages.DELTE_NOTIFICATIONS,
            })*/
            var deleteAllPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELTE_NOTIFICATIONS

            }).then(function(res) {
                if (res) {
                    PostService.DeleteAllNotification().then(function() {
                        $scope.notifications = [];
                    });
                }
            });
        }
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            $scope.displayMessage = false;
            $scope.notifications = [];
            $scope.moredata = false;
            loadNotificationFromDB();
            $scope.doRefresh = onDoRefresh;
            $scope.delete = onDelete;
            $scope.deleteAll = onDeleteAll;
            $rootScope.$on('notificationupdated', loadNotificationFromDB);
        }
        onInit();
    }
    /**
     * Define dependency of AssignedSurveyCtrl
     * @type {Array}
     */
    NotificationsCtrl.$inject = ['$scope', '$rootScope',
        '$ionicListDelegate', '$ionicPopup', '$timeout', '$window', '$filter',
        'Synchronizer', 'PostService', 'UserResourceDB', 'SecuredPopups'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('NotificationsCtrl', NotificationsCtrl);
}());