(function() {
        // "use strict";
        // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

        function QuickSurveyCtrl($scope, $rootScope, $location,
            $ionicPopup, $q,
            PostService, OrgResourceDB, checklists, locations, questionMap,SecuredPopups	) {

            /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if (fromState.name === "app.quickSurvey") {
                onClear();
            }
        }
            /**
             * On Synchronization load Checklist and Location again from database
             */
            function onSynechronized() {
                $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'checklist'),
                    OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                ]).then(function(data) {
                    $scope.checklists = JSON.parse(data[0].resource);
                    $scope.locations = JSON.parse(data[1].resource);
                });
            }

            /**
             * Clears the selection of Location and Checklist Dropdown controls
             */
            function onClear() {
                $scope.survey.locationID = null;
                $scope.survey.checklistID = null;
                $scope.survey.checklistLabel = 'Select Checklist';
                $scope.survey.locationLabel = 'Select Location';
                $scope.showRequired = false;
            }

            /**
             * Event Handler for Start Button Click
             * Creates a Survey Object and Populates it with required questions
             */
            function onStart(form) {
                $scope.showRequired = true;
                if ($scope.survey.checklistID && $scope.survey.locationID) {
                    var dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 7);

                    var survey = $rootScope.__survey = {
                        checklistID: $scope.survey.checklistID,
                        checklist: $scope.survey.checklistLabel,
                        locationID: $scope.survey.locationID,
                        location: $scope.survey.locationLabel,
                        dueDate: dueDate,
                        status: 'L',
                        isCreatedOnDevice: true,
                        questionIDs: getQuestionIds($scope.survey.checklistID),
                        Questions: getQuestionIds($scope.survey.checklistID).map(function(item) {
                                var q = questionMap[item.questionID];
                                q.order = parseInt(item.displayOrder);
                                q.answers = [];
                                return q;
                            })
                        };

                        return PostService.CreateSurvey(survey)
                            .then(function(id) {
                                onClear();
                                form.$setUntouched();
                                $scope.disableCheck = true;
                                $location.path('/app/survey/' + id);
                            });

                    } else {
                        /*return $ionicPopup.alert({
                            scope: $scope,
                            title: $rootScope.Messages.REQ_FIELDS_TITLE,
                            template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                        });*/
                        var navConfirmPopup = SecuredPopups.show('alert', {
                                                                 title: $rootScope.Messages.MESSAGE_TITLE,
                                                                 template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                                          
                                                                 });
                            return navConfirmPopup;
                    }
                }

                /**
                 * Returns questionIds associated with selected Checklist
                 * @param  {int} checklistId Id of the Checklist selected by user
                 * @return {Array}             Array of QuestionIds associated with given checklist
                 */
                function getQuestionIds(checklistId) {
                    for (var i = $scope.checklists.length - 1; i >= 0; i--) {
                        if ($scope.checklists[i].id === checklistId) {
                            return $scope.checklists[i].questionIDs;
                        }
                    }
                }

                /**
                 * Event Handler to execute Initialization Logic
                 */
                function onInit() {
                    $scope.survey = {
                        checklistLabel: 'Select Checklist',
                        locationLabel: 'Select Location'
                    };
                    $scope.checklists = checklists;
                    $scope.locations = locations;
                    $scope.showRequired = false;
                    $scope.$on('Synchronized', onSynechronized);
                    $scope.clear = onClear;
                    $scope.start = onStart;
                    $scope.$on('$stateChangeStart', onStateChangeStart);
                }

                onInit();
            }

            /**
             * Define dependency of QuickSurveyCtrl
             * @type {Array}
             */
            QuickSurveyCtrl.$inject = ['$scope', '$rootScope', '$location',
                '$ionicPopup', '$q',
                'PostService', 'OrgResourceDB', 'checklists', 'locations', 'questionMap','SecuredPopups'
            ];

            /**
             * Register QuickSurveyCtrl with healthApp.controllers Module
             */
            angular.module('healthApp.controllers').controller('QuickSurveyCtrl', QuickSurveyCtrl);

        }());