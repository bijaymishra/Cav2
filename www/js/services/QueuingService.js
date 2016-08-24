(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QueuingService(QueueDB, Analytics, $rootScope, $q) {
        function __generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        }

        function addToQueue(data) {
            return QueueDB.push({
                    userId: $rootScope.user.userId,
                    message: angular.toJson(data)
                })
                .then(function() {
                    $rootScope.$broadcast("MESSAGE_ADDED");
                });
        }

        function createIssue(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "issue",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'issue',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function deleteNotification(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Delete",
                label: "notification",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'notification',
                action: 'delete',
                object: null
            });
        }

        function createSurvey(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "survey",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'survey',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function updateSurvey(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Update",
                label: "survey",
                value: data.id
            });

            if (data.status) {
                Analytics.trackEvent({
                    category: "API",
                    action: "Draft",
                    label: "survey",
                    value: data.id
                });
            }

            if (data.dateOfCompletion) {
                Analytics.trackEvent({
                    category: "API",
                    action: "Complete",
                    label: "survey",
                    value: data.id
                });
            }

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'survey',
                action: 'update',
                object: angular.toJson(data)
            });
        }

        function createIssueAttachments(images) {
            return $q.all(images.map(function(image) {
                var id = image.id;

                Analytics.trackEvent({
                    category: "API",
                    action: "Create",
                    label: "issueattachment",
                    value: id
                });


                return addToQueue({
                    identifier: id,
                    sessionId: $rootScope.user.sessionId,
                    request: 'Sync',
                    datasource: 'issueattachment',
                    action: 'create',
                    object: angular.toJson(image)
                });
            }));
        }

        function deleteIssueAttachment(id) {
            Analytics.trackEvent({
                    category: "API",
                    action: "Delete",
                    label: "issueattachment",
                    value: id
                });

            return addToQueue({
                identifier: id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'issueattachment',
                action: 'delete',
                object: null
            });
        }

        function deleteIssueAttachments(images) {
            return $q.all(images.map(function(image) {
                deleteIssueAttachment(image.id);
                delete image.id;
            }));
        }

        function createAnswer(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "answer",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'answer',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function deleteAnswer(id) {
        	Analytics.trackEvent({
                category: "API",
                action: "Delete",
                label: "answer",
                value: id
            });

            return addToQueue({
                identifier: id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'answer',
                action: 'delete',
                object: null
            });
        }

        

        return {
        	getId : __generateUUID,
        	addToQueue : addToQueue,
        	createIssue : createIssue,
        	deleteNotification : deleteNotification,
        	createSurvey : createSurvey,
        	updateSurvey : updateSurvey,
        	createIssueAttachments : createIssueAttachments,
        	deleteIssueAttachments : deleteIssueAttachments,
        	deleteIssueAttachment : deleteIssueAttachment,
        	createAnswer : createAnswer,
        	deleteAnswer : deleteAnswer
        };

    }

    QueuingService.$inject = ['QueueDB', 'Analytics', '$rootScope', '$q'];
    angular.module('healthApp.services').factory('QueuingService', QueuingService);
}());
     