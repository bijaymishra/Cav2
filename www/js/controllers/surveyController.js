(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SurveyCtrl($scope, $rootScope, $stateParams, $state, $q, $timeout, $filter,
        $ionicModal, $ionicActionSheet, $cordovaCamera, $ionicPopup, $ionicLoading, $ionicScrollDelegate,
        UserResourceDB, OrgResourceDB, SurveyDB, AttachmentDB, Analytics,$window,
        apiService, queryService, PostService, $cordovaFile, $location, SecuredPopups) {

        var noImage = "images/no-picture.jpg";
        var reqFieldsAlert = null;
        var debounceBroadCastScroll = ionic.debounce(onBroadCastScroll, 50); 
        function onBroadCastScroll(){
            $scope.$broadcast('survey-scrolling', null);
        }

        $scope.broadcastScroll = function(){
           debounceBroadCastScroll();
        };
 
    /*
    * This code to reload keyboard on orientation change in ios devices.
    */
    if($rootScope.iphone4Orientation == 'true'){
    $window.addEventListener('orientationchange', reloadKeyboardOnly, false);
    }
    function reloadKeyboardOnly(){
    //alert("Orientation changed");
   if($rootScope.isVisible){
    var focused = document.activeElement;
    document.activeElement.blur();
    focused.focus();
   }
 
    }

        /**
         * Checks if Current Answer fails Validation
         * @return {[type]} [description]
         */
        function doesCurrentAnswerFailsValidation(returnPromise, openQuestion) {

            var q = $scope.currentQuestion;
            if (q && q.currentAnswer) {
                //If current answer is dummy - and option is not selected - invalid - only do not save.
                //If current answer is dummy - and option is selected as NC and description is not provided - invalid, do not save - do not allow to loose focus
                if (q.currentAnswer.compliant === "NC" && !q.currentAnswer.freeText) {
                    q.currentAnswer.isValidated = true;
                    if (!reqFieldsAlert) {
                        reqFieldsAlert = SecuredPopups.show('alert', {
                            title: $rootScope.Messages.MESSAGE_TITLE,
                            template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                        });
                        reqFieldsAlert.then(function() {
                            reqFieldsAlert = null;
                        });
                    }
             $timeout(function() {
                if ($ionicScrollDelegate.$getByHandle('survey-scroll')) {
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTo(0, (q.topPosition || 0), true);
                }
               
          }, 50);
                    return true;
                }

                q.currentAnswer.isModified = JSON.stringify(angular.copy(q.currentAnswer)) !== q.__ca;
                if (q.currentAnswer.isModified && q.currentAnswer.compliant) {

                    var promise = saveAnswer(q, q.currentAnswer);
                    if (returnPromise) {
                        return promise;
                    }
                }
                if (!openQuestion) {
                    q.currentAnswer.isCurrent = false;
                    q.currentAnswer.isEditable = false;
                }

            }
            return false;
        }

        function onJobTypeById(id){
            var item = $scope.jobTypes.filter(function(i){ 
                return i.id === id;
            });
            if (item.length === 1){
                return item[0].name;
            }
        }

        /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if (toState.name !== "login" && !$scope.disableCheck) {
                event.preventDefault();
                if (doesCurrentAnswerFailsValidation(false, true)) {
                    return;
                }

                if (toState.name === "app.quickIssue" && $scope.currentQuestion) {
                    var surveyState = {};
                    surveyState.currentQuestionId = $scope.currentQuestion.id;
                    surveyState.currentScroll = $ionicScrollDelegate.$getByHandle('survey-scroll').getScrollPosition();
                    $rootScope.surveyState = surveyState;
                } else {
                    $rootScope.surveyState = null;
                }


                // if ($scope.currentQuestion) {
                //     $scope.currentQuestion.isCurrent = false;
                //     $scope.currentQuestion = null;
                // }


                // Note: Disabling the Confirmation box as per jira ticket MP-358
                //$ionicPopup.confirm({     
                //    title: 'Confirmation',
                //    template: 'Do you want to navigate to another page?'
                //}).then(function(res) {
                //    if (res) {
                $scope.disableCheck = true;
                $state.transitionTo(toState.name, toParams);
                //    }
                //});
            }
        }

        
        /**
         * Function to register Modals to be used from AppController.
         * Namely - defaultAnswerModal - when user clicks on Complete, this view is shown to him to get default answer
         *         - AdditionalInfo - when user clicks on '...' additional infor modal window is shown
         *         - imageZoom - when user clicks on any image, image is expanded
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/defaultAnswer.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.defaultAnswerModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/additionalinfo.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.additionalInfo = modal;
            });

            $ionicModal.fromTemplateUrl('templates/imageZoom.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.imageZoom = modal;
            });
        }

        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.defaultAnswerModal.remove();
            if ($scope.additionalInfo) {
                $scope.additionalInfo.remove();
            }
            $scope.imageZoom.remove();
        }

        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        function onDestroy() {
            _unRegisterModals();
            queryService.removeQuery('cannot-logout');
        }

        /**
         * Utility function to provide count of answer for given type of compliance
         */
        function countOfAnswerByType(type, answers) {
            var count = 0;
            for (var i = answers.length - 1; i >= 0; i--) {
                if (answers[i].compliant === type) {
                    count++;
                }
            }
            return count;
        }



        /**
         * Event Handler to display Action Sheet when user clicks on Camera Icon
         * @param  {number} id Indicating which Camera Icon was clicked
         * @param  {Answer} answer Answer object to which image needs to be attached
         */
        function onShowActionSheet(answer, id) {
            if (!(id >= 0 && id < $scope.maxImageCount))
                return;

            $scope.freezeQuestion = true;

            var takePhoto = '<i class="icon ion-camera"></i> Take Photo',
                choosePhoto = '<i class="icon ion-camera"></i> Choose Photo',
                cameraOnly = [{
                    text: takePhoto
                }],
                cameraNGallery = [{
                    text: takePhoto
                }, {
                    text: choosePhoto
                }],
                selectedOptions = $rootScope.selectedOrg.gallery === 0 ? cameraOnly : cameraNGallery;
            //($rootScope.selectedOrg.gallery === 1 ? cameraNGallery : cameraNGallerWithMoveTo);

            $ionicActionSheet.show({
                buttons: selectedOptions,
                titleText: 'Take an action',
                cancelText: 'Cancel',
                buttonClicked: function(index) {
                    $timeout(function() {
                        _addImages(answer, id, index);
                    }, 100);
                    return true;
                },
                cancel: function() {
                    $scope.freezeQuestion = false;
                }
            });

        }

        /**
         * Method to invoke Camera or Selection of Image from Gallery and attaching it to Issue
         * @param {Answer} answer Answer to which Image needs to be attached
         * @param {number} id    Indicating which Camera icon was clicked
         * @param {number} index Indicating if Camera or Gallery functionality needs to be invoked.
         */
        function _addImages(answer, id, index) {
            var destinationType = ($rootScope.selectedOrg.gallery == 1 && index == 2) ||
                ($rootScope.selectedOrg.gallery == 2) ? Camera.DestinationType.FILE_URI : Camera.DestinationType.DATA_URL;

            //destinationType = Camera.DestinationType.DATA_URL;
            var options = {
                quality: 60,
                destinationType: destinationType,
                sourceType: index === 0 ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY,
                //allowEdit: true,
                targetHeight: 1000,
                encodingType: Camera.EncodingType.JPEG,
                correctOrientation: true,
                saveToPhotoAlbum: ($rootScope.selectedOrg.gallery == 2)
            };

            $cordovaCamera.getPicture(options)
                .then(function(imageData) {
                    OnImageCaptur(imageData, id, index, destinationType, answer);
                }).catch(function(e) {
                    var data = {
                        type: 'angular',
                        url: window.location.hash,
                        localtime: Date.now(),
                        message: e.message,
                        name: e.name,
                        stack: e.stack
                    };
                    Analytics.trackException(JSON.stringify(data), false);
                    $scope.freezeQuestion = false;
                });
        }

        function OnImageCaptur(imageData, id, index, destinationType, answer) {
            try {
                if (destinationType == Camera.DestinationType.FILE_URI) {
                    $cordovaFile.readAsDataURL(cordova.file.tempDirectory, imageNameFromPath(imageData))
                        .then(function(success) {
                            attachImageData(answer, id, index, success, true);
                        }, function(error) {
                            //console.log("error = ", error);
                        });

                } else {
                    attachImageData(answer, id, index, imageData, false);
                }

            } catch (e) {
                var data = {
                    type: 'angular',
                    url: window.location.hash,
                    localtime: Date.now(),
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                };
                Analytics.trackException(JSON.stringify(data), false);
            }
        }

        function imageNameFromPath(imagePath) {
            var name = imagePath.substr(imagePath.lastIndexOf('/') + 1);
            return name;

        }

        function attachImageData(answer, id, index, imageData, isDataURL) {
            answer.issue.images = answer.issue.images || function() {};

            if (answer.issue.images["imageId" + id]) {

                var srcArr = answer.issue.issueAttachment;
                var destArr = [];
                srcArr.forEach(function(imageid){
                    if (imageid !== answer.issue.images["imageId" + id]){
                        destArr.push(imageid);
                    }
                });
                answer.issue.issueAttachment = destArr;
                answer.issue.images.deleteImages = answer.issue.images.deleteImages || [];
                answer.issue.images.deleteImages.push(answer.issue.images["imageId" + id]);
            }

            answer.issue.images['imgData' + id] = isDataURL ? imageData.substr(23) : imageData;
            answer.issue.images['imgURI' + id] = isDataURL ? imageData : "data:image/jpeg;base64," + imageData;

            answer.issue.images['showImage' + id] = true;

            delete answer.issue.images["imageId" + id];
            delete answer.issue.images["imageFN" + id];
            $scope.freezeQuestion = false;
        }

        /**
         * Event Handler for Remove Image trigger
         * @param {Answer} answer Answer from which Image needs to be removed
         * @param  {number} id Indicates which image to be removed
         */
        function onRemoveImages(answer, id) {
            if (!(id >= 0 && id < $scope.maxImageCount))
                return;

            /*$ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.DELETE_ATTACH_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE
            })*/
            var deleteAttachedPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE

            }).then(function(res) {
                if (res) {

                    if (answer.issue.images["imageId" + id]) {
                        answer.issue.images.deleteImages = answer.issue.images.deleteImages || [];
                        answer.issue.images.deleteImages.push(answer.issue.images["imageId" + id]);
                    }
                    answer.issue.images['imgData' + id] = null;
                    answer.issue.images['imgURI' + id] = noImage;
                    answer.issue.images['showImage' + id] = false;
                    delete answer.issue.images["imageId" + id];
                    delete answer.issue.images["imageFN" + id];
                }
            });
        }

        /**
         * Event Handler - View Image - When user clicks on Image, Image needs to be Zoomed
         * @param {Answer} answer Answer from which Image needs to be Viewed
         * @param  {number} id Indicates which Image was been clicked on
         */
        function onViewImages(answer, id) {
            $scope.zoomImageSrc = answer.issue.images['imgURI' + id];
            $scope.imageZoom.show();
            if (answer.issue.images["imageId" + id]) {
                AttachmentDB.getBigPictureById(answer.issue.images["imageId" + id])
                    .then(function(data) {
                        $scope.zoomImageSrc = "data:image/" + data.ext + ";base64," + data.bigData;
                    });
            }
        }

        /**
         * Event Handler for Search text Change
         * If Search text has changed and current questions, current answer is invalid state,
         * search text should be reverted to empty string, and user should be asked to fix the
         * answer
         */
        function onSearchTextChanged() {
            if (doesCurrentAnswerFailsValidation()) {
                $scope.query.search = '';
            } else {
                $scope.query.__search = $scope.query.search || '';
                var searchText = $scope.query.__search.toLowerCase();
                var isOdd = true;
                var iCount = 0;
                if ($scope.survey && $scope.survey.Questions){
                    $scope.survey.Questions.forEach(function(row){
                        row.hide = !(((row.name && row.name.toLowerCase().indexOf(searchText) !== -1) || (row.category && row.category.toLowerCase().indexOf(searchText) !== -1)));
                        if (!row.hide){
                            row.isOdd = isOdd;
                            isOdd = !isOdd;
                            iCount++;
                        }
                    });
                }
                $scope.visibleRecords = iCount;
                $scope.__filteredQuestions = [];
                $scope.__filteredQuestionsLength = 0;
                copyPageOfQuestions();
                $timeout(function(){
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTop();
                         },100);
            }
        }


        // /**
        //  * Search Filter to search Questions
        //  */
        // function searchFilter(row) {
        //     var searchText = ($scope.query.__search || '').toLowerCase();
        //     return ((row.name && row.name.toLowerCase().indexOf(searchText) !== -1) || (row.category && row.category.toLowerCase().indexOf(searchText) !== -1));
        // }

        /**
         * Utility function returns a new blank answer
         */
        function newAnswer(defaultActionPlan) {
            var images = function() {};
            images.imgURI0 = noImage;
            images.showImage0 = false;
            images.imgURI1 = noImage;
            images.showImage1 = false;
            images.imgURI2 = noImage;
            images.showImage2 = false;

            return {
                id: PostService.getId(),
                freeText: '',
                isDummy: true,
                issue: {
                    id: PostService.getId(),
                    resolved: "N",
                    images: images,
                    issueAttachment: [],
                    actionPlan: defaultActionPlan || ""
                }
            };
        }

        /**
         * Event Handler for OnClick of Question
         * If Current Question, has current Answer which is invalid, prompt user and exit algorithm
         */
        function onQuestionSelected(question) {
            if ($scope.freezeQuestion)
                return;

            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!question.isCurrent) {
                if ($scope.currentQuestion){
                    $scope.currentQuestion._answers = [];
                }
                question._answers = question.answers;
                question.showAnswers = false;

                if ($scope.currentQuestion && $scope.currentQuestion.isCurrent) {
                    $scope.currentQuestion.isCurrent = false;
                    if ($scope.currentQuestion.currentAnswer) {
                        $scope.currentQuestion.currentAnswer.isCurrent = false;
                        $scope.currentQuestion.currentAnswer = null;
                    }
                    $scope.currentQuestion = null;
                }

                $scope.currentQuestion = question;
                question.isCurrent = true;

                var deviceInfo = Analytics.getDeviceInformation();
 
                //alert('true' + deviceInfo.version);
 
                if(deviceInfo.platform == "iOS"){
 
                    $timeout(function(){
                    $scope.$apply(function(){
                        $scope.movingUpwards = true;
                    });
                },500);
                }

                if (question.answers.length === 0 || (question.answers.length > 0 && !question.answers[0].isDummy)) {
                    var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
                } else {
                    question.answers.forEach(function(a) {
                        a.isCurrent = false;
                        a.isEditable = false;
                    });
                }

                var answer = question.answers[0];
                answer.isCurrent = true;
                question.currentAnswer = answer;
                question.__ca = JSON.stringify(angular.copy(answer));

            } else {
                if ($scope.currentQuestion && $scope.currentQuestion.isCurrent) {
                    $scope.currentQuestion.isCurrent = false;
                    if ($scope.currentQuestion.currentAnswer) {
                        $scope.currentQuestion.currentAnswer.isCurrent = false;
                        $scope.currentQuestion.currentAnswer = null;
                    }
                    $scope.currentQuestion = null;
                }
            }
        }

        function onMakeAnswerEditable(question, answer) {
            if (doesCurrentAnswerFailsValidation(false, true)) {
                return;
            }
            
            if (!question.answers[0].isDummy){
                var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
            }

            question.answers.forEach(function(a) {
                a.isEditable = false;
                a.isCurrent = false;
            });

            question.currentAnswer = answer;
            answer.isCurrent = true;
            answer.isEditable = true;
            question.__ca = JSON.stringify(answer);
        }

        function onShowHideAnswers(question) {
            // if (doesCurrentAnswerFailsValidation()) {
            //     return;
            // }

            question.showAnswers = !question.showAnswers;
        }

        function onRevertAnswer(question, answer) {
            SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.REVRT_MESSAGE
            }).then(function(res) {
                if (res) {
                    var ans = JSON.parse(question.__ca);
                    UpdateAnswer(ans, $scope.imagemap);
                    for (var prop in answer) {
                        answer[prop] = ans[prop];
                    }
                    answer.isEditable = false; //MP-530
                }
            });
        }

        /**
         * Event Handler to add new answer
         */
        function onAddAnswer(question) {

            var isDummy = question.currentAnswer.isDummy;

            if (question.currentAnswer.isDummy && !question.currentAnswer.compliant) {
                return;
            }

            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!isDummy){
                question.currentAnswer.isEditable = false;
                return;
            }

            if (question.answers[0].isDummy && !question.answers[0].compliant) {
                question.answers[0].isCurrent = true;
                question.currentAnswer = question.answers[0];
                question.__ca = JSON.stringify(angular.copy(question.answers[0]));
                return;
            }
            
            var answers = question.answers;
            question._answers = question.answers = [];
            question.answers.push(newAnswer(question.defaultActionPlan));
            for (var i = 0; i <= answers.length - 1; i++) {
                answers[i].isCurrent = false;
                question.answers.push(answers[i]);
            }

            var answer = question.answers[0];
            answer.isCurrent = true;
            question.currentAnswer = answer;
            question.__ca = JSON.stringify(angular.copy(answer));
        }

        function onDeleteAnswer(question, answer) {
            
            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!question.answers[0].isDummy){
                var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
            }

            var index = question.answers.findIndex(function(e, i, a) {
                return e.id === answer.id;
            });

            SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELETE_ANSWER

            }).then(function(res) {
                if (res) {
                    if (index > -1) {
                        question.answers.splice(index, 1);
                        question._answers = question.answers;
                    }
                    PostService.DeleteAnswer(answer.id)
                        .then(function() {
                            return PostService.UpdateSurveyInMemory($scope.survey);
                        }).then(function() {
                            if (question.answers.length === 0) {
                                question.answers.push(newAnswer(question.defaultActionPlan));
                            }
                            var ans = question.answers[0];
                            ans.isCurrent = true;
                            question.currentAnswer = ans;
                            question.__ca = JSON.stringify(angular.copy(ans));
                        });
                }
            });
        }

        function onSelectAnswer(q, a) {
            if (!a.isCurrent) {
                if (doesCurrentAnswerFailsValidation()) {
                    return;
                }
                q.currentAnswer = a;
                a.isCurrent = true;
                q.__ca = JSON.stringify(angular.copy(a));
            }
        }

        function onSaveAsDraft() {
            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            PostService.SaveSurveyWithStatus($scope.survey)
                .then(function() {
                    return PostService.UpdateSurveyInMemory($scope.survey);
                }).then(function() {
                    /*$ionicPopup.alert({
                        title: $rootScope.Messages.DRAFT_TITLE,
                        template: $rootScope.Messages.DRAFT_MESSAGE
                    })*/
                    var msgDraftPopup = SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.DRAFT_MESSAGE

                    }).then(function(res) {
                        $rootScope.$broadcast("surveyupdated");
                        $scope.disableCheck = true;
                        $state.transitionTo('app.assignedSurvey');
                    });
                });
        }

        function onSaveAsComplete() {
            var promise = doesCurrentAnswerFailsValidation(true);
            if (!angular.isObject(promise)) {
                if (promise) {
                    return;
                }
            }


            var surveyHasUnAnsweredQuestion = false;
            $scope.survey.Questions.forEach(function(q) {
                if ((q.answers.length === 0) || (q.answers.length === 1 && q.answers[0].isDummy)) {
                    surveyHasUnAnsweredQuestion = true;
                }
            });

            if (surveyHasUnAnsweredQuestion) {
                $scope.defaultAnswerModal.show();
            } else {
                if (angular.isObject(promise)) {
                    promise.then(function() {
                        PostService.UpdateSurvey($scope.survey)
                            .then(function() {
                                /*$ionicPopup.alert({
                                    title: $rootScope.Messages.COMPLETE_TITLE,
                                    template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                                })*/
                                var msgCompletePopup = SecuredPopups.show('alert', {
                                    title: $rootScope.Messages.MESSAGE_TITLE,
                                    template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                                }).then(function(res) {
                                    $rootScope.$broadcast("surveyupdated");
                                    $scope.disableCheck = true;
                                    $state.transitionTo('app.assignedSurvey');
                                });
                            });
                    });
                } else {
                    PostService.UpdateSurvey($scope.survey)
                        .then(function() {
                            /*$ionicPopup.alert({
                                title: $rootScope.Messages.COMPLETE_TITLE,
                                template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                            })*/
                            var msgCompleteElsePopup = SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                            }).then(function(res) {
                                $rootScope.$broadcast("surveyupdated");
                                $scope.disableCheck = true;
                                $state.transitionTo('app.assignedSurvey');
                            });
                        });
                }
            }
        }

        function onUpdateAnswer(answer, compliant) {
            if (answer.compliant && !answer.isDummy) {
                /* $ionicPopup.alert({
                    title: $rootScope.Messages.ANS_LOCKED_TITLE,
                    template: $rootScope.Messages.ANS_LOCKED_MESSAGE
                });*/
                var ansLockedPopup = SecuredPopups.show('alert', {
                    title: $rootScope.Messages.MESSAGE_TITLE,
                    template: $rootScope.Messages.ANS_LOCKED_MESSAGE
                });
            } else {
                answer.compliant = compliant;
                if (answer.compliant === "NC") {
                    answer.issue = answer.issue || {
                        resolved: 'N'
                    };
                }
            }
        }

        function Level1Object(item) {
            var data = {
                name: item.name,
                externalDisplayID: item.externalDisplayID,
                treeName: item.treeName,
                subItems: []
            };

            for (var key in item) {
                if (!(key === "name" || key === "treeName" || key === "externalDisplayID")) {
                    data.subItems.push(Level2Object(item[key]));
                }
            }

            return data;
        }

        function Level2Object(item) {
            var data = {
                name: item.name,
                externalDisplayID: item.externalDisplayID,
                subItems: []
            };

            for (var key in item) {
                if (!(key === "name" || key === "externalDisplayID")) {
                    data.subItems.push(item[key]);
                }
            }

            return data;
        }


        function onPopulateAdditionalInfo(question) {
            $scope.additionalInfoData = [];
            if ($rootScope.isOnline && $scope.selectedOrg.isSubscribed) {
                apiService.getMoreInfo($rootScope.user.sessionId, question.id)
                    .success(function(data) {
                        if (data.status.success === "true") {

                            var info = [];
                            angular.forEach(data.response, function(r) {
                                info.push(Level1Object(r));
                            });

                            $scope.additionalInfoData = info;
                            $scope.isOffline = true;
                        }
                    })
                    .error(function(data) {});
            }

            if (!$rootScope.isOnline) {
                $scope.isOffline = false;
                $scope.linkedStnd = $rootScope.Messages.WIFI_LINKED_STND_MESSAGE;
            }
        }

        function onShowAdditionalInfo(question) {
            $scope.additionalInfoQuestion = question;
            $scope.populateAdditionalInfo(question);
            $ionicScrollDelegate.$getByHandle('addInfo-scroll').scrollTo(0, 0, false);
            $scope.additionalInfo.show();
        }

        function onCloseAdditionalInfo() {
            $ionicScrollDelegate.$getByHandle('addInfo-scroll').scrollTo(0, 0, false);
            $scope.additionalInfo.hide();
        }

        function onSelectDefaultAnswer(answerOption) {
            $scope.defaultAnswerModal.hide();
            $scope.survey.defaultAnswer = answerOption;
            return PostService.UpdateSurvey($scope.survey)
                .then(function() {
                    /* var alertPopup = $ionicPopup.alert({
                        title: $rootScope.Messages.COMPLETE_TITLE,
                        template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                    });
                    alertPopup*/
                    var CompleteMsgPopup = SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                    }).then(function(res) {
                        $rootScope.$broadcast("surveyupdated");
                        $scope.disableCheck = true;
                        $state.transitionTo('app.assignedSurvey');
                    });
                });


        }

        function saveAnswer(q, a) {
            if (a.isDummy && !a.compliant) {
                return;
            }

            delete a.isDummy;

            a.updated = moment(new Date()).format('MM/DD/YYYY'); //new Date();

            return PostService.SaveAnswer(a, q, $scope.survey)
                .then(function() {
                    if ($scope.survey.status != 'T') {
                        $scope.survey.status = 'T';
                        return PostService.SaveSurveyWithStatus($scope.survey);
                    }
                }).then(function() {
                    return PostService.UpdateSurveyInMemory($scope.survey);
                }).then(function() {

                    for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                        if (a.issue.images['imgURI' + i] !== noImage &&
                            a.issue.images['imageId' + i] && a.issue.images['_imgData' + i]) {
                            var image = {
                                ext: '.jpeg',
                                data: a.issue.images['_imgData' + i],
                                attachmentId: a.issue.images['imageId' + i]
                            };
                            $scope.imagemap[image.attachmentId] = image;
                        }
                    }
                });
        }

        /**
         * Populates Survey Object with Image Attachments and Funcitons to return count of question based on type
         */
        function populateSurveyWithImagesAndFuncitons(map) {
            $scope.survey.Questions.forEach(function(q) {
                q.compliant = function() {
                    return countOfAnswerByType('C', this.answers);
                };
                q.noncompliant = function() {
                    return countOfAnswerByType('NC', this.answers);
                };
                q.notApplicable = function() {
                    return countOfAnswerByType('NA', this.answers);
                };
                q.isCurrent = false;

                q.answers.forEach(function(a) {
                    return UpdateAnswer(a, map);
                });
            });
            $scope.displayMessage = true;

            if ($rootScope.surveyState) {
                var index = $scope.survey.Questions.findIndex(function(e) {
                    return e.id === $rootScope.surveyState.currentQuestionId;
                });
                if (index > -1) {
                    onQuestionSelected($scope.survey.Questions[index]);
                }
                var currentPosition = $rootScope.surveyState.currentScroll;
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTo(currentPosition.left, currentPosition.top);
                delete $rootScope.surveyState;
            }
        }

        function UpdateAnswer(a, map) {
            a.issue.images = function() {};
            a.issue.issueAttachment = a.issue.issueAttachment || [];
            var i = 0;
            a.issue.issueAttachment.forEach(function(id) {
                if (map[id]) {
                    a.issue.images['imgData' + i] = null;
                    a.issue.images['imgURI' + i] = "data:image/" + map[id].ext + ";base64," + map[id].data;
                    a.issue.images['showImage' + i] = true;
                    a.issue.images['imageId' + i] = map[id].attachmentId;
                    i++;
                }
            });
            if (i < 3) {
                for (var y = i; y < 3; y++) {
                    a.issue.images['imgData' + y] = null;
                    a.issue.images['imgURI' + y] = noImage;
                    a.issue.images['showImage' + y] = false;
                    delete a.issue.images["imageId" + y];
                    delete a.issue.images["imageFN" + y];
                }
            }
        } 

        function copyPageOfQuestions() {
            var counter = 0;
            //var index = $scope.__filteredQuestionsLength;
 
                $scope.__Questions = $scope.__Questions || [];

            while (counter < 30 && $scope.__filteredQuestionsLength < $scope.__Questions.length){
                var question = $scope.__Questions[$scope.__filteredQuestionsLength];
                if (!question.hide){
                    $scope.__filteredQuestions[$scope.__filteredQuestions.length] = question;
                    counter++;
                }
                $scope.__filteredQuestionsLength++;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }

        function onHideTopBar(){
            // if ($ionicScrollDelegate.$getByHandle('survey-scroll')) {
            //     $ionicScrollDelegate.$getByHandle('survey-scroll').scrollBy(0, -600, false);
            // }
            // 
            $ionicScrollDelegate.freezeScroll(true);
            $scope.movingUpwards = !$scope.movingUpwards;
            console.log("Moving Upward " + $scope.movingUpwards + " - from controller");
            $timeout(function(){
                $ionicScrollDelegate.freezeScroll(false);
            }, 50);
            
            // $timeout(function(){
            //     $scope.$apply(function(){
            //         $scope.movingUpwards = true;
            //     });
            // },50);
            
        }

        function onInit() {
            $scope.displayMessage = false;
            $scope.maxImageCount = 3;
            $scope.query = {};
            $scope.currentQuestion = null;
            $scope.currentAnswer = null;
            $scope.isOffline = true;
            $scope.selectedOrg = $rootScope.selectedOrg;
            $scope.loadMoreData = copyPageOfQuestions;
            $scope.hideTopBar = onHideTopBar;

            _registerModals();

            queryService.setQuery('cannot-logout', doesCurrentAnswerFailsValidation);
            $scope.$watch('query.search', onSearchTextChanged);
            $scope.$on('$destroy', onDestroy);
            $scope.$on('$stateChangeStart', onStateChangeStart);

            //$scope.searchFilterFunction = searchFilter;
            $scope.showAS = onShowActionSheet;
            $scope.removeImages = onRemoveImages;
            $scope.viewImages = onViewImages;
            $scope.selectQuestion = onQuestionSelected;
            $scope.addAnswer = onAddAnswer;
            $scope.deleteAnswer = onDeleteAnswer;
            $scope.selectAnswer = onSelectAnswer;
            $scope.saveAsDraft = onSaveAsDraft;
            $scope.saveAsComplete = onSaveAsComplete;
            $scope.updateAnswer = onUpdateAnswer;
            $scope.populateAdditionalInfo = onPopulateAdditionalInfo;
            $scope.showAdditionalInfo = onShowAdditionalInfo;
            $scope.closeAddiitonalInfo = onCloseAdditionalInfo;
            $scope.selectDefaultAnswer = onSelectDefaultAnswer;
            $scope.makeAnswerEditable = onMakeAnswerEditable;
            $scope.revertAnswer = onRevertAnswer;
            $scope.showHideAnswers = onShowHideAnswers;
            $scope.jobTypeById = onJobTypeById;
            $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING;

            if ($rootScope.__survey) {
                $scope.survey = $rootScope.__survey;
                $scope.visibleRecords = $scope.survey.Questions.length;
                $scope.survey.Questions = $filter('orderBy')($scope.survey.Questions, 'order');
                $scope.__Questions = $scope.survey.Questions.map(function(item, index){ 
                    var isOdd = index % 2;
                    item.isOdd = isOdd;
                    item.hide = false;
                    return item; 
                });
                $scope.__filteredQuestions = [];
                $scope.__filteredQuestionsLength = 0;
                copyPageOfQuestions();

                if ($scope.survey.Questions && $scope.survey.Questions.length > 180){
                    $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING_TOO_LONG;
                }
                $rootScope.qiLocationId = $scope.survey.locationID;
                $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'jobtype'),
                    AttachmentDB.getBySurveyId($stateParams.surveyId)
                ]).then(function(data) {
                    $scope.jobTypes = JSON.parse(data[0].resource);
                    var map = {};
                    data[1].forEach(function(item) {
                        map[item.attachmentId] = item;
                    });
                    return map;
                }).then(function(map) {
                    $scope.imagemap = map;
                    populateSurveyWithImagesAndFuncitons(map);
                });
                delete $rootScope.__survey;
            } else {
                SurveyDB.getById($rootScope.user.userId, $stateParams.surveyId)
                    .then(function(data) {
                        $scope.survey = JSON.parse(data.json);
                        $scope.visibleRecords = $scope.survey.Questions.length;
                        $scope.survey.Questions = $filter('orderBy')($scope.survey.Questions, 'order');
                        $scope.__Questions = $scope.survey.Questions.map(function(item, index){ 
                            var isOdd =  (index % 2) || false;
                            item.isOdd = isOdd;
                            item.hide = false;
                            return item; 
                        });
                        $scope.__filteredQuestions = [];
                        $scope.__filteredQuestionsLength = 0;
                        copyPageOfQuestions();

                        if ($scope.survey.Questions && $scope.survey.Questions.length > 180){
                            $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING_TOO_LONG;
                        }

                        $rootScope.qiLocationId = $scope.survey.locationID;
                    }).then(function() {
                        return $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'jobtype'),
                            AttachmentDB.getBySurveyId($stateParams.surveyId)
                        ]);
                    }).then(function(data) {
                        $scope.jobTypes = JSON.parse(data[0].resource);
                        var map = {};
                        data[1].forEach(function(item) {
                            map[item.attachmentId] = item;
                        });
                        return map;
                    }).then(function(map) {
                        $scope.imagemap = map;
                        populateSurveyWithImagesAndFuncitons(map);
                    }).catch(function(e){
                        console.log(e);
                    });
            }
        }

        onInit();
    }

    SurveyCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$state', '$q', '$timeout', '$filter',
        '$ionicModal', '$ionicActionSheet', '$cordovaCamera', '$ionicPopup', '$ionicLoading', '$ionicScrollDelegate',
        'UserResourceDB', 'OrgResourceDB', 'SurveyDB', 'AttachmentDB', 'Analytics','$window',
        'apiService', 'queryService', 'PostService', '$cordovaFile', '$location', 'SecuredPopups'
    ];

    angular.module('healthApp.controllers').controller('SurveyCtrl', SurveyCtrl);
}());