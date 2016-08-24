(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AssignedSurveyCtrl($scope, $rootScope, $ionicPopup, $timeout, $window,
        Synchronizer, PostService, SurveyDB, SecuredPopups) {

        function IsOnline() {
            if ($window.cordova) {
                return ($window.navigator.connection.type !== $window.Connection.NONE);
            } else {
                return $window.navigator.onLine;
            }
        }

        /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if ($scope.stopNavigation){
                event.preventDefault();
            }
        }

        /**
         * Load Surveys from Database
         */
        function loadSurveyFromDB() {
            SurveyDB.getSummary($rootScope.user.userId)
                .then(function(data) {
                    $scope.surveys = data.map(function(item) {
                        return {
                            surveyId: item.surveyId,
                            checklist: item.checklist,
                            location: item.location,
                            dueDate: item.dueDate,
                            dueDateDisplay: moment(item.dueDate).format('MM/DD/YYYY'),
                            _status: item._status
                        };
                    });

                    $scope.displayMessage = true;
                });
        }

        /**
         * Event Handler for Refresh Events
         * If User is Online
         *     Synchronizes Survey and Load it from Database
         * Else
         *     Provide a Message to User, Survey cannot be Synchronized as App is Offline
         */
        function onDoRefresh() {
            if ($scope.stopNavigation){
                return;
            }
            
            $scope.stopNavigation = true;
            $timeout(function() {
                if (IsOnline()) {
                    Synchronizer.SyncUserResources()
                        .then(loadSurveyFromDB)
                        .then(function() {
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.stopNavigation = false;
                        })
                        .catch(function(e) {
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
                        template: $rootScope.Messages.SYNC_SURVEY_OFF_MESSAGE
                    });
                }
            }, 500);
        }

        /**
         * Filter Function for filtering Surveys
         */
        function _searchFilter(row) {
            var searchText = ($scope.query.search || '').toLowerCase();
            return ((row.checklist && (row.checklist.toLowerCase().indexOf(searchText) !== -1)) ||
                    (row.location && (row.location.toLowerCase().indexOf(searchText) !== -1)) ||
                    (row.dueDate && (row.dueDate.toString().toLowerCase().indexOf(searchText) !== -1))) &&
                ((row._status === $scope.query.status || row._status === "Draft") || !($scope.query.status));
        }
 
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            /**
             * Initiatilze data
             */
            $scope.query = {
                status: "Open"
            };

            $scope.status = [{
                id: 'Open',
                name: 'Open',
                css: 'open_color'
            }, {
                id: 'Draft',
                name: 'Draft',
                css: 'draft_color'
            }];

            loadSurveyFromDB();

            /**
             * Initilaize Event Handlers and Public Functions to be used in View
             */
            $rootScope.$on("Synchronized", loadSurveyFromDB);
            $scope.$on('$stateChangeStart', onStateChangeStart);
            $scope.doRefresh = onDoRefresh;
            $scope.searchFilterFunction = _searchFilter;
        }

        onInit();

    }

    /**
     * Define dependency of AssignedSurveyCtrl
     * @type {Array}
     */
    AssignedSurveyCtrl.$inject = ['$scope', '$rootScope', '$ionicPopup', '$timeout', '$window',
        'Synchronizer', 'PostService', 'SurveyDB', 'SecuredPopups'
    ];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('AssignedSurveyCtrl', AssignedSurveyCtrl);
}());