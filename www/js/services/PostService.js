(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function PostService(QueuingService, UserResourceDB, SurveyDB, $rootScope, $q, AttachmentDB) {
        var self = this;
        var noImage = "images/no-picture.gif";

        self.getId = QueuingService.getId;

        self.DeleteAnswer = function(id) {
            return QueuingService.deleteAnswer(id);
        };

        self.SaveQuickIssue = function(data) {
            var issue = {
                id: QueuingService.getId(),
                categoryID: data.categoryID,
                locationID: data.locationID,
                description: data.description,
                actionPlan: data.actionPlan,
                source: data.source,
                resolved: data.resolved ? "Y" : "N",
                resolutionDate: data.resolved ? new Date() : null
            };

            var images = [];
            var noImage = "images/no-picture.gif";

            for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                if (data['imgURI' + i] !== noImage) {
                    var identifier = QueuingService.getId();
                    images.push({
                        id: identifier,
                        //identifier: identifier,
                        issueID: issue.id,
                        filename: identifier + ".jpeg",
                        picture: data['imgData' + i]

                    });
                }
            }

            return QueuingService.createIssue(issue)
                .then(QueuingService.createIssueAttachments(images));
        };

        self.DeleteNotification = function(notification) {
            var currentNotifications = [];
            return QueuingService.deleteNotification(notification)
                .then(function() {
                    return UserResourceDB.getByType($rootScope.user.userId, 'notification');
                })
                .then(function(notifications) {
                    notifications.resource = JSON.parse(notifications.resource);
                    var index = notifications.resource.findIndex(function(e, i, a) {
                        return e.id === notification.id;
                    });
                    if (index > -1) {
                        notifications.resource.splice(index, 1);
                    }
                    currentNotifications = notifications.resource;
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.notification = currentNotifications.length;
                    return UserResourceDB.AddOrUpdate(notifications);
                })
                .then(function() {
                    return currentNotifications;
                });
        };

        self.DeleteAllNotification = function() {
            var data = { id: 'all' };
            return QueuingService.deleteNotification(data)
                .then(function() {
                    return UserResourceDB.getByType($rootScope.user.userId, 'notification');
                }).then(function(notifications) {
                    notifications.resource = [];
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.notification = 0;
                    return UserResourceDB.AddOrUpdate(notifications);
                });
        };

        self.SaveAnswer = function(answer, question, survey) {
            var oAnswer = {
                id: answer.id,
                surveyID: survey.id,
                questionID: question.id,
                uniqueID: answer.uniqueID,
                jobTypeID: answer.jobTypeID,
                freeText: answer.freeText,
                compliant: answer.compliant
            };

            return QueuingService.createAnswer(oAnswer)
                .then(function() {
                    if (answer.compliant === "NC") {
                        //save issue and issueattachment if any
                        var oIssue = {
                            id: answer.issue.id,
                            actionPlan: answer.issue.actionPlan,
                            answerID: oAnswer.id,
                            description: oAnswer.freeText,
                            source: '',
                            resolutionDate: answer.issue.resolutionDate || (answer.Resolved ? new Date() : null),
                            resolved: answer.issue.resolved //? "Y" : "N"
                        };

                        var images = [];
                        var deleteImages = [];

                        if (answer.issue.images.deleteImages) {
                            answer.issue.images.deleteImages.forEach(function(id) {
                                deleteImages.push({
                                    id: id,
                                    issueID: oIssue.id
                                });
                            });
                        }

                        for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                            if (answer.issue.images['imgURI' + i] !== noImage && !answer.issue.images['imageId' + i] && answer.issue.images['imgData' + i]) {

                                var identifier = QueuingService.getId();
                                images.push({
                                    id: identifier,
                                    //identifier: identifier,
                                    issueID: oIssue.id,
                                    filename: identifier + ".jpeg",
                                    picture: answer.issue.images['imgData' + i]
                                });
                                answer.issue.issueAttachment.push(identifier);
                                answer.issue.images['imageId' + i] = identifier;
                                answer.issue.images['_imgData' + i] = answer.issue.images['imgData' + i];
                                answer.issue.images['imgData' + i] = null;
                            }
                        }

                        QueuingService.deleteIssueAttachments(deleteImages)
                            .then(function() {
                                return $q.all(deleteImages.map(function(item) {
                                    AttachmentDB.deleteById(item.id);
                                }));
                            });

                        updateImagesInDb(images, survey)
                            .then(function() {
                                return QueuingService.createIssue(oIssue);
                            }).then(function() {
                                return QueuingService.createIssueAttachments(images);
                            });
                    }
                });
        };

        function updateImagesInDb(images, survey) {
            return $q.all(images.map(function(item) {
                AttachmentDB.add({
                    attachmentId: item.id,
                    surveyId: survey.id,
                    ext: 'jpeg',
                    data: item.picture,
                    bigData: item.picture,
                    orgId: $rootScope.user.orgId
                });
            }));
        }

        self.UpdateSurveyInMemory = function(data) {
            return SurveyDB.update({
                surveyId: data.id,
                userId: $rootScope.user.userId,
                checklist: data.checklist,
                location: data.location,
                dueDate: data.dueDate,
                _status: data.status === "T" ? "Draft" : "Open",
                tempId: data.tempId,
                json: angular.toJson(data)
            });
        };

        self.AddSurveyInDB = function(data) {
            return SurveyDB.add({
                surveyId: data.id,
                userId: $rootScope.user.userId,
                checklist: data.checklist,
                location: data.location,
                dueDate: data.dueDate,
                _status: data.status === "T" ? "Draft" : "Open",
                tempId: data.tempId,
                json: angular.toJson(data)
            });
        };

        self.CreateSurvey = function(data) {
            data.id = QueuingService.getId();

            var survey = {
                locationID: data.locationID,
                checklistID: data.checklistID,
                status: data.status,
                id: data.id,
                isCreatedOnDevice: true
            };

            return QueuingService.createSurvey(survey)
                .then(function() {
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.survey = $rootScope.resourcesCount.survey + 1;
                    data.tempId = data.id;
                    return self.AddSurveyInDB(data);
                }).then(function() {
                    return data.id;
                });
        };

        self.SaveSurveyWithStatus = function(survey) {
            var oSurvey = {
                id: survey.id,
                locationID: survey.locationID,
                checklistID: survey.checklistID,
                status: survey.status
            };

            return QueuingService.updateSurvey(oSurvey)
                .then(function() {
                    return self.UpdateSurveyInMemory(survey);
                });
        };

        self.UpdateSurvey = function(survey) {
            var oSurvey = {
                id: survey.id,
                locationID: survey.locationID,
                checklistID: survey.checklistID,
                dateOfCompletion: new Date(),
                defaultAnswer: survey.defaultAnswer
            };

            return QueuingService.updateSurvey(oSurvey)
                .then(function() {
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.survey = $rootScope.resourcesCount.survey - 1;
                    return $q.all([SurveyDB.deleteById($rootScope.user.userId, survey.id),
                        AttachmentDB.deleteBySurveyId(survey.id)
                    ]);
                });
        };

        return self;
    }

    PostService.$inject = ['QueuingService', 'UserResourceDB', 'SurveyDB', '$rootScope', '$q', 'AttachmentDB'];
    angular.module('healthApp.services').factory('PostService', PostService);

}());