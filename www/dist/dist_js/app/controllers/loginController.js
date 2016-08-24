(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function LoginCtrl($scope, $rootScope, 
            $state, $timeout, $location,
            $ionicModal, $ionicPopup, $ionicLoading, 
            apiService, $templateCache, templateService, Synchronizer, QueueDB, UserResourceDB, Analytics, SecuredPopups, AppResourceDB, DB) {

        /**
         * Function to register Modals to be used from AppController.
         * Namely - SelectOrganization Modal - to allow selecting Organization if Login has returned multiple Organization
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/orgSelect.html', {
                scope: $scope,
                animation: 'scale-in'
            }).then(function(modal) {
                $scope.selectOrganizationModal = modal;
            });

            // var t = $templateCache.get('orgSelect.html');

            // $scope.selectOrganizationModal = $ionicModal.fromTemplate(t, {
            //     scope: $scope, // Use our scope for the scope of the modal to keep it simple
            //     animation: 'slide-in-up' // The animation we want to use for the modal entrance
            // });
        }

        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.selectOrganizationModal.remove();
        }

        /**
         * Event Handler for Login Button Click
         * If Login is successful, 
         *     Check list of Organization returned. If only one Organization is returned select it and initiate Data Sync
         *     If Mutliple Organizations are returned, Provide user with dialog to select Organization
         */
        function onDoLogin(){
            $scope.clicked = new Date();
            
            apiService.login($scope.loginData.username, $scope.loginData.password)
                .then(function(response) {
                    var data = response.data;
                    if (data.status.success === "true") {
                        _getErrorMessages();
                        $scope.organizations = data.response.orgList;
                        $rootScope.user = {
                            name: $scope.loginData.username,
                            sessionId: data.response.sessionID
                        };
                        $rootScope.attempts = 0;

                        // //Below code shall be uncommented to load the latest templates from server
                        //apiService.getTemplates($rootScope.user.sessionId, null)
                        //    .success(function (data) {
                        //       templateService.addTemplatesToCache(data.response);
                        //   });

                        if ($scope.organizations.length === 1) {
                            onSelectOrg($scope.organizations[0]);
                        } else {
                            $scope.selectOrganizationModal.show();
                        }

                    } else {
                         var alertPopup = SecuredPopups.show('alert', {
                              title: $rootScope.Messages.MESSAGE_TITLE,
                            template: data.status.message
                           });
                    }
                })
                .catch(function(data) {
                    SecuredPopups.show('alert', {
                        scope: $scope,
                        title: $rootScope.Messages.MESSAGE_TITLE, 
                        template: $rootScope.Messages.API_ERROR_MESSAGE
                    });
                });
        }

        /**
         * Event Handler for Organization Selection
         * Capture configuration values returned by SwitchOrg API, and initiate Synchronization
         */
        function onSelectOrg(org) {

            $rootScope.selectedOrg = org;
            $rootScope.user.orgId = org.id;

            $scope.selectOrganizationModal.hide();

            apiService.switchOrganization($rootScope.user.sessionId, org.id)
                .then(function(response) {
                    $rootScope.user.userId = response.data.response.userID;
                    $rootScope.selectedOrg.isSubscribed = response.data.response.isSubscribed;
                    $rootScope.selectedOrg.gallery = response.data.response.gallery;
                    $rootScope.selectedOrg.timeout = response.data.response.schema.timeout;
                    $rootScope.selectedOrg.syncInterval = response.data.response.schema.syncInterval;
                    Analytics.setUserId($rootScope.user.userId); //GA Tracking
                    $rootScope.serviceRequests = response.data.response.schema.serviceRequests;
                    $state.transitionTo('synchronize', { isLogin : true });
                });
        }

        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        function onDestroy() {
            _unRegisterModals();
        }

        /**
         * Event Handler to be executed when User cancels Select Org Screen without selecting Organization
         */
        function onSelectOrgViewCanceled() {
            $scope.selectOrganizationModal.hide();
            $rootScope.$broadcast('logout');
            $location.path('/login');

        }

        /**
         * Event Handler to handle Logout Event
         * Disable Background Synchronization,
         * Clear Scope data
         * And popup alert to user with reason for Logout
         */
        function onLogout() {
            Synchronizer.DisableBackgroundSynchronizer();
            $rootScope.user = {};
            $scope.loginData.password = "";
            var message = $rootScope.UserActivityTimeout ? $rootScope.Messages.AUTO_LOGGED_OUT : $rootScope.Messages.LOGGED_OUT;
           /* $ionicPopup.alert({
                scope: $scope,
                title: $rootScope.Messages.LOGOUT_TITLE,
                template: message
            })*/
                    var logOutPopup = SecuredPopups.show('alert', {
                                      title: $rootScope.Messages.MESSAGE_TITLE,
                                      template: message
                                         });
        }

        /**
         * Get Pre-Login Error Messages
         */
        function _getErrorMessages() {
            $scope.emailAddress = $rootScope.Messages.ENTER_EMAIL_ADDRESS;
            $scope.msgDataPendingForSyncInQueue = $rootScope.Messages.YOUR_DATA_SYNCING_WEB_PORTAL;
            $scope.msg_OnLogout = $rootScope.Messages.LOGGED_OUT;
        }
        function _getlastLoggedInUser() {
            DB.init().then(function () {
                AppResourceDB.getByType("lastUser").then(function (data) {
                    $scope.loginData.username = data.resource.split('"').join('');                   
                });
            });
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            _getlastLoggedInUser();
            _registerModals();
            $scope.selectOrg = onSelectOrg;
            $rootScope.resources = {};
            $scope.loginData = {};
            $scope.loggedOut = false;
            $scope.initialLogin = "";
            $scope.subSequentLogin = "";
            $scope.emailAddress = "";

            $scope.doLogin = onDoLogin;
            $scope.logout = onSelectOrgViewCanceled;

            $scope.$on('$destroy', onDestroy);
            $rootScope.$on('logout', onLogout);
        }

        onInit();

    }

    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    LoginCtrl.$inject = ['$scope', '$rootScope', 
            '$state', '$timeout', '$location',
            '$ionicModal', '$ionicPopup', '$ionicLoading', 
            'apiService', '$templateCache', 'templateService', 'Synchronizer', 'QueueDB', 'UserResourceDB', 'Analytics', 'SecuredPopups', 'AppResourceDB', 'DB'];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('LoginCtrl', LoginCtrl);

}());