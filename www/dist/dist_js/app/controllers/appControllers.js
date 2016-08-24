(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    function AppCtrl($scope, $rootScope,
        $q, $state, $window, $timeout, $interval,
        $ionicLoading, $ionicModal, $ionicPopup,
        QueueDB, Synchronizer, Analytics, queryService, SecuredPopups) {
        /**
         * Function to register Modals to be used from AppController.
         * Namely - AutoLogoutModal - when user is idle for 'X' minutes. Where 'X' is hardcode currently to 30 mins
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/autoLogout.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.autoLogoutModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/queueProcessing.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.queueMoal = modal;
            });

            
        }
        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.autoLogoutModal.remove();
        }
       

        /**
         * Handler to reduce Count-down, once started
         * Apart from reducing Count-down, it also checks if Count-down has been completed
         * if Yes, it logouts user and redirects him/her to Login Screen
         * It Also, checks if there was any User Activity, and it needs to shut down the counter
         * and close Auto-Logout Modal View
         */
        var timerArray = [];

        function tick() {
            if ($rootScope.UserActivityTimeout) { //Check if there was User Activity,
                $scope.logoutCounter--; //Decrement the counter - it will be reflected on screen
                if ($scope.logoutCounter > 0) { //Check if Logout out counter has been completed
                    timerArray.push($timeout(tick, 1000));
                } else {
                    if ($rootScope.user && $rootScope.user.userId) {
                        /**
                         * Log Google Analytics Event for Auto-Logout
                         */
                        if (!$state.is('login')) {
                            Analytics.trackEvent({
                                category: "Authentication",
                                action: "Auto Logout",
                                label: "userid",
                                value: $rootScope.user.userId
                            });
                            $rootScope.$broadcast('logout'); //Lgout
                            $state.transitionTo('login'); //Redirect user to Login Screen
                        }
                    }
                }
            } else {
                $scope.autoLogoutClose(); //Since there was user Activity - shut down counter and close Auto-Logout View
            }
        }
        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        var cleanUserIdleHandler;

        function onDestroy() {
            _unRegisterModals();
            cleanUserIdleHandler();
        }
        
        /**
         * Event handler to be execute when user is idle
         * @param  {number} diff Provides number of minutes user has been Idle additional to upper limit set.
         * This number if greater than 1, user has idle and application was minimized, hence application was
         * not able to trigger this event
         * In case diff is not greater than 1, then it indicates application is active, show user count-down modal
         */
        function onUserIdle(event, diff) {
            timerArray.map(function(timerPromise) {
                //console.log("cancelling promise...");
                $timeout.cancel(timerPromise);
            });
            /**
             * Log Google Analytics Event for Logout
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "User Idle",
                label: "userid",
                value: $rootScope.user.userId
            });
            if (diff.value >= 0) {
                /**
                 * Log Google Analytics Event for Logout - When application was in Background and Activated
                 */
                if (!$state.is('login')) {
                    Analytics.trackEvent({
                        category: "Authentication",
                        action: "Auto Logout - Background",
                        label: "userid",
                        value: $rootScope.user.userId
                    });
                    onAutoLogoutClose();
                    $rootScope.$broadcast('logout'); //Logout
                    $state.transitionTo('login'); //Redirect user to Login Screen
                }
            } else {
                if (diff.value < 0 && diff.value >= -1) {
                    if (diff.resumedFromBg !== true) {
                        $scope.logoutCounter = 60;
                    } else {
                        $scope.logoutCounter = Math.round(Math.abs(diff.value) * 60);
                    }

                    timerArray.push($timeout(tick, 1000)); //Handler to reduce Countdown on every second
                    $scope.autoLogoutModal.show(); //Show countdown Modal View to User
                }
            }
        }
        /**
         * Event Handler to close Auto-Logout Countdown Window. Used by Auto-Logout Modal Popup
         * @return {[type]} [description]
         */
        function onAutoLogoutClose() {
            $scope.autoLogoutModal.hide();
        }

        /**
         * Event Handler to handle Loguout request by User - when he clicks on Logout link on sidemenu
         * @return {void}
         */
        function onLogout() {
            /**
             * Check if Survey page is allowing to logout. If Survey page has current answer as 'NC',
             * and answer is invalid then user cannot logout unless he has fixed the answer and saved it.
             */
            if (queryService.executeQuery('cannot-logout')) {
                return;
            }
            /**
             * Log Google Analytics Event for Logout
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Logout",
                label: "userid",
                value: $rootScope.user.userId
            });
            /**
             * Logout algorithm
             * If User tries to logout - check if he has any entries in Queue table.
             *     If Yes
             *         Check if application is Not Online
             *             If Yes
             *                 Warn user, it has unsaved data in Queue, and data will
             *                 not be lost but it will not be synced and he may not be
             *                 able to see it on Portal
             *             If No
             *                 Warn user, it has unsaved data in Queue, and data will be
             *                 synchronized before he logs out.
             *                 Synchronize Queue and then Logout
             *     If No
             *         Logout user, broadcast the Logut event
             *         Redirect user to Login Screen
             */
            QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) { //Are there any records in Queue
                        if (!$rootScope.isOnline) { //Is Application Online

                            SecuredPopups.show('confirm', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.QUEUE_PEND_OFF_MESSAGE
                            }).then(function(result) {
                                if (result) {
                                    $rootScope.$broadcast('logout'); //Logout
                                    $state.transitionTo('login'); //Redirect user to Login Screen
                                }
                            });
                        } else {
                            SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE, //'Queue Sync Pending',
                                //template: $rootScope.Messages.QUEUE_PEND_ON_MESSAGE, //'You have saved work from an out of WI-FI session. Your data is been Synchronized.'
                                template: $rootScope.Messages.LOGOUT_ONLINE_DATA_IN_QUEUE //'You have saved work  that will now be updated to server.'
                            }).then(function(res) {
                                if (res) {
                                    $scope.queueMoal.show();
                                }
                                Synchronizer.SyncQueue() 
                                    .then(function() {
                                    if ($rootScope.SyncError) { 
                                        $scope.queueMoal.hide();
                                        return SecuredPopups.show('alert', {
                                            title: $rootScope.Messages.MESSAGE_TITLE,
                                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR_LOGOUT
                                        });
                                    }
                                }).then(function() {
                                    $scope.queueMoal.hide(); //Hide In Progress Icon
                                    $rootScope.$broadcast('logout'); //Logout
                                    $state.transitionTo('login'); //Redirect User to Login Screen
                                });
                            });
                        }
                    } else {
                        $rootScope.$broadcast('logout'); //Logout
                        $state.transitionTo('login'); //Redirect User to Login Screen
                    }
                });
        }

        /**
         * Event handler for Help Menu Click
         */
        function onHelp() {
            /**
             * Log Google Analytics for invocation of Help
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Help",
                label: "userid",
                value: $rootScope.user.userId
            });
            $window.open('https://readypointhealth.uservoice.com/', '_system');
            return false;
        }
        /**
         * Event Handler for Synchronize Event, when user clicks on Synchronize Menu Option in Side-Menu
         * If Application is Offline, giving message to user, Synchronization cannot be initiated
         * Provide prompt to end user - if he would like to do clean Sync or would like to go partialy/differential Sync
         */
        function onSynchronize() {
            if (!$rootScope.isOnline) {
                return SecuredPopups.show('alert', {
                    title: $rootScope.Messages.MESSAGE_TITLE, 
                    template: $rootScope.Messages.SYNC_MAN_OFF_MESSAGE 
                });
            }
            /**
             * Log Google Analytics Event for Syncrhonization - due to user activity
             * @type {String}
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Synchronize-Manual",
                label: "userid",
                value: $rootScope.user.userId
            });
            /**
             * Prompt user for full or differential Synchronization
             */
            
            var synOptPopup = SecuredPopups.show('alert', {
                template: $rootScope.Messages.SYNC_OPT_MESSAGE, //'Do you wish clean offline database and do complete data synchronize?',
                title: $rootScope.Messages.MESSAGE_TITLE, //'Synchronize',
                scope: $scope,
                buttons: [{
                    text: 'Yes',
                    type: 'button-positive',
                    onTap: function() { $state.transitionTo('synchronize', { isLogin : false }); }
                }, {
                    text: 'No',
                    type: 'button-positive'
                }]
            });
        }
        /**
         * During development or for some other reason, if application looses it state
         * this method will be executed and user will be redirected to Login Screen
         */
        function onStateCleared() {
            if (!$rootScope.user) {
                $state.transitionTo('login'); //Redirect to Login Screen
            }
        }
        
        /**
         * Display Logic for Toggling Reset Data
         */
        function onToggleResetData() {
            $scope.showResetData = ($scope.showResetData) ? false : true;
        }
        
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            _registerModals();
            /**
             * Event Handlers and Functions attached to $scope to be used in View
             */
            $scope.$on('$destroy', onDestroy);
            cleanUserIdleHandler = $rootScope.$on('UserIdle', onUserIdle);
            $scope.autoLogoutClose = onAutoLogoutClose;

            $rootScope.$watch('user', onStateCleared);
            $scope.logout = onLogout;
            $scope.help = onHelp;
            $scope.synchronize = onSynchronize;
            $scope.toggleResetData = onToggleResetData;
        }
        onInit();
    }
    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    AppCtrl.$inject = ['$scope', '$rootScope',
        '$q', '$state', '$window', '$timeout', '$interval',
        '$ionicLoading', '$ionicModal', '$ionicPopup',
        'QueueDB', 'Synchronizer', 'Analytics', 'queryService', 'SecuredPopups'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('AppCtrl', AppCtrl);
}());