(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function introCtrl($scope, $rootScope, $state,
        $ionicSlideBoxDelegate, $ionicPlatform, $ionicModal, $timeout, $interval,
        UserResourceDB, $ionicPopup, SecuredPopups, Analytics) {


        //var confirmSkip;
        var confirmRepeat;

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

                            if (confirmRepeat){
                                $scope.abondanRepeat = true;
                                confirmRepeat.close(true);
                            }

                            // if (confirmSkip){
                            //     confirmSkip.close(true);
                            // }

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

                    if (confirmRepeat){
                        $scope.abondanRepeat = true;
                        confirmRepeat.close(true);
                    }

                    // if (confirmSkip){
                    //     confirmSkip.close(true);
                    // }

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
                    
                    if (confirmRepeat){
                        $scope.abondanRepeat = true;
                        confirmRepeat.close(true);
                    }

                    // if (confirmSkip){
                    //     confirmSkip.close(true);
                    // }
                    
                    //NOTE: if confirmSkip is on, $timeout is required for this invocation
                    $timeout(function(){ 
                      $scope.autoLogoutModal.show(); //Show countdown Modal View to User
                    },50);
                }
            }
        }
        /**
         * Event Handler to close Auto-Logout Countdown Window. Used by Auto-Logout Modal Popup
         * @return {[type]} [description]
         */
        function onAutoLogoutClose() {
            $timeout(function(){
                $scope.autoLogoutModal.hide();
            }, 50);
        }

        $scope.leftButton = "Skip Intro";
        $scope.rightButton = "Next";


        /**
         * Event Handler to handle navigating between Intro Screen to Login Screen
         * Before navigating - update an entry in AppResource table to remember - user has seen Intro pages
         */
        function onStartApp() {
            var confirmRepeat = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.INTRO_SCREEN_MESSAGE,
                cancelText: 'No',
                okText: 'Yes'

            });

            confirmRepeat.then(function(result) {
                if (!$scope.abondanRepeat) {
                    if (!result) {
                        var data = {
                            userId: $rootScope.user.userId,
                            resourceType: "appAccessed",
                            resource: true,
                            timeStamp: new Date(),
                        };
                        UserResourceDB.AddOrUpdate(data);
                    }
    
                    $state.go('app.quickAction');
                    confirmRepeat = null;
                }
            });

        }

        function onLogout(){
            $rootScope.$broadcast('logout'); //Logout
            $state.transitionTo('login'); //Redirect user to Login Screen
        }
        /**
         * Event Handler for Next button click
         */
        function onNext() {
            $ionicSlideBoxDelegate.next();
        }

        /**
         * Event Handler for Previous button click
         */
        function onPrevious() {
            $ionicSlideBoxDelegate.previous();
        }

        function onLeftButtonClick() {
            if ($scope.leftButton === "Skip Intro") {
                onStartApp();
            } else {
                onPrevious();
            }
        }

        function onRightButtonClick() {
            if ($scope.rightButton === "Next") {
                onNext();
            } else {
                onStartApp();
            }
        }

        function onSlideIndexChanged(newValue) {
            if (newValue > 0) {
                $scope.leftButton = "Previous";
            }

            if (newValue === 0) {
                $scope.leftButton = "Skip Intro";
            }

            if (newValue == 8) {
                $scope.rightButton = "Start App";
            }

            if (newValue < 8) {
                $scope.rightButton = "Next";
            }
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            if (!$rootScope.user) {
                $state.transitionTo('login');
                return;
            }

            _registerModals();
            /**
             * Event Handlers and Functions attached to $scope to be used in View
             */
            $scope.$on('$destroy', onDestroy);
            cleanUserIdleHandler = $rootScope.$on('UserIdle', onUserIdle);
            $scope.autoLogoutClose = onAutoLogoutClose;

            $scope.next = onNext;
            $scope.previous = onPrevious;
            $scope.startApp = onStartApp;
            $scope.leftButtonClick = onLeftButtonClick;
            $scope.rightButtonClick = onRightButtonClick;
            $scope.slideIndex = 0;
            $scope.$watch("slideIndex", onSlideIndexChanged);
            $scope.logout = onLogout;
            $ionicSlideBoxDelegate.slide(0, 1);
            // //Note: Do not change this instance to SecuredPopups. 
            // //It requires to be ionicPopup as it needs to be closed in code
            // confirmSkip = $ionicPopup.confirm({
            //     title: 'Message',
            //     template: $rootScope.Messages.INTRO_SCREEN_INFO_MESSAGE,
            //     cancelText: 'Skip',
            //     okText: 'View'
            // });

            // confirmSkip.then(function(result) {
            //     if (!result) {
            //         $state.go('app.quickAction');
            //     }
            //     confirmSkip = null;
            // });
        }

        onInit();
    }

    /**
     * Define dependency of introCtrl
     * @type {Array}
     */
    introCtrl.$inject = ['$scope', '$rootScope', '$state',
        '$ionicSlideBoxDelegate', '$ionicPlatform', '$ionicModal', '$timeout', '$interval',
        'UserResourceDB', '$ionicPopup', 'SecuredPopups', 'Analytics'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('introCtrl', introCtrl);
}());