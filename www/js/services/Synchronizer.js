(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function Synchronizer($rootScope,
        QueueDB, OrgResourceDB, AppResourceDB, UserResourceDB, SurveyDB, Timer,
        apiService, $q, $timeout, $interval, AttachmentDB, $state, $ionicPopup) {
        var self = this;

        function filterForAddUpdate(items) {
            var list = [];
            items.forEach(function(item) {
                if (item.status !== "D") {
                    list.push(item);
                }
            });
            return list;
        }

        function filterForDelete(items) {
            var list = [];
            items.forEach(function(item) {
                if (item.status === "D") {
                    list.push(item);
                }
            });
            return list;
        }

        function removeFromArray(src, dest, matcher) {
            if (angular.isArray(src) && angular.isArray(dest)) {
                dest.forEach(function(item) {
                    var index = src.findIndex(function(e) {
                        return matcher(e, item);
                    });
                    if (index >= 0) {
                        src.splice(index, 1);
                    }
                });
            }
        }

        function addUpdateIntoArray(src, dest, matcher) {
            if (angular.isArray(src) && angular.isArray(dest)) {
                dest.forEach(function(item) {
                    var index = src.findIndex(function(e) {
                        return matcher(e, item);
                    });
                    if (index > 0) {
                        src[index] = item;
                    } else {
                        src.push(item);
                    }
                });
            }
        }

        var matcherBy = {
            "errormessages": function(src, dest) {
                return src.token === dest.token;
            },
            "GetTemplates": function(src, dest) {
                return src.key === dest.key;
            },
            "checklist": function(src, dest) {
                return src.id === dest.id;
            },
            "category": function(src, dest) {
                return src.id === dest.id;
            },
            "jobtype": function(src, dest) {
                return src.id === dest.id;
            },
            "location": function(src, dest) {
                return src.id === dest.id;
            },
            "question": function(src, dest) {
                return src.id === dest.id;
            },
            "notification": function(src, dest) {
                return src.id === dest.id;
            },
            "issueattachment": function(src, dest) {
                return src.id === dest.id;
            }
        };

        var mapperFor = {
            "errormessages": function(items) {
                return items.map(function(item) {
                    return {
                        token: item.token,
                        message: item.message
                    };
                });
            },
            "GetTemplates": function(items) {
                return items.map(function(item) {
                    return {
                        key: item.key,
                        value: item.value
                    };
                });
            },
            "checklist": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name,
                        questionIDs: item.questionIDs
                    };
                });
            },
            "category": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "jobtype": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "location": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "question": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        isJobType: item.isJobType,
                        isUniqueID: item.isUniqueID,
                        compliantAnswer: item.compliantAnswer,
                        answerTemplate: item.answerTemplate,
                        categoryID: item.categoryID,
                        category: item.categoryName, 
                        hasStandards: item.hasStandards,
                        defaultActionPlan: item.defaultActionPlan
                    };
                });
            },
            "notification": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        message: item.message,
                        created: item.created
                    };
                });
            },
            "issueattachment": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        issueID: item.issueID,
                        filename: item.filename,
                        picture: item.picture,
                        surveyId: item.surveyID,
                        orgId: item.ownerID
                    };
                });
            }
        };

        function __synchronizeResource(dbInvoker, resourceType, apiInvoker, dbInvokerAddUpdate) {
            Timer.start('Synchronize', 'Resources', resourceType);
            return dbInvoker(resourceType)
                .then(function(data) {
                    data = data || {};
                    data.resourceType = resourceType;
                    data.resource = data.resource ? JSON.parse(data.resource) : [];
                    data.orgId = ($rootScope.user || {}).orgId;
                    data.userId = ($rootScope.user || {}).userId;

                    return apiInvoker(data.timeStamp)
                        .then(function(response) {
                            if (response && response.data && response.data.status && response.data.status.success === "true") {
                            //if (response.data.status.success === "true") {
                                data.timeStamp = response.data.status.currentTimestamp;
                                if (!data.resource) {
                                    data.resource = mapperFor[resourceType](response.data.response);
                                } else {
                                    var entriesToAddUpdate = mapperFor[resourceType](filterForAddUpdate(response.data.response));
                                    var entriesToDelete = filterForDelete(response.data.response);
                                    removeFromArray(data.resource, entriesToDelete, matcherBy[resourceType]);
                                    addUpdateIntoArray(data.resource, entriesToAddUpdate, matcherBy[resourceType]);
                                }
                                $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                                $rootScope.resourcesCount[resourceType] = data.resource.length;
                                if (resourceType === 'notification'){
                                    $rootScope.$broadcast('notificationupdated');
                                }
                                var resource = data.resource;
                                return dbInvokerAddUpdate(data).then(function() {
                                    return resource;
                                });
                            }
                        })
                        .catch(function(e) {});
                })
                .catch(function(e) {});
        }

        function getOrgChecklistMap(orgId) {
            return OrgResourceDB.getByType(orgId, "checklist").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgLocationMap(orgId) {
            return OrgResourceDB.getByType(orgId, "location").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgCategoryMap(orgId) {
            return OrgResourceDB.getByType(orgId, "category").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgQuestionMap(orgId) {
            return OrgResourceDB.getByType(orgId, "question").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item;
                });
                return map;
            });
        }

        self.getOrgQuestionMap = getOrgQuestionMap;

        function mergeArray(arrDest, arrSrc) {
            for (var i = arrSrc.length - 1; i >= 0; i--) {
                arrDest.push(arrSrc[i]);
            }
        }

        self.SyncSurveys = function() {
            Timer.start('Synchronize', 'Resources', 'survey');

            return self.SyncQueue()
                .then(function() {
                    if ($rootScope.SyncError) {
                        return $ionicPopup.alert({
                            title: $rootScope.Messages.QUEUE_PEND_TITLE,
                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR
                        });
                    } else {
                        return getOrgQuestionMap($rootScope.user.orgId)
                            .then(function(data) {
                                var questionData = data;
                                return SurveyDB.deleteByUserId($rootScope.user.userId)
                                    .then(function() {
                                        return _syncSurveyByPage(1, questionData);
                                    });
                            });
                    }
                });
        };

        function _syncSurveyByPage(index, questionData) {
            if (index === 0) {
                return;
            }

            return apiService.retrieveData($rootScope.user.sessionId, "survey", null, index)
                .then(function(data) {
                    var surveys = data.data.response;
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};

                    if (index === 1) {
                        $rootScope.resourcesCount.survey = surveys.length;
                    } else {
                        $rootScope.resourcesCount.survey += surveys.length;
                    }

                    return $q.all(surveys.map(function(item) {
                        var attachmentIds = [];
                        item.checklist = item.name;
                        item.location = item.locationName;
                        delete item.locationName;
                        item.Questions = item.questions.map(function(q) {
                            var question = questionData[q.questionID];
                            if (question) {
                                question.order = parseInt(q.displayOrder);
                                question.answers = q.answers.map(function(a) {
                                    if (a.compliant === "NC") {
                                        a.freeText = a.issue.description;
                                    }
                                    a.issue = a.issue || {
                                        resolved: "N"
                                    };
                                    a.issue.issueAttachment = a.issue.issueAttachment || [];
                                    mergeArray(attachmentIds, a.issue.issueAttachment || []);
                                    return a;
                                });
                                return question;
                            }
                        });
                        item.isProcessed = true;
                        //Save Survey
                        //Update Attachments
                        return SurveyDB.add({
                            surveyId: item.id,
                            userId: $rootScope.user.userId,
                            checklist: item.checklist,
                            location: item.location,
                            dueDate: item.dueDate,
                            _status: item.status === "T" ? "Draft" : "Open",
                            json: angular.toJson(item),
                            tempId: item.tempID
                        });
                    })).then(function() {
                        var status = data.data.status;
                        if (status.page < status.totalPages) {
                            return status.page + 1;
                        } else {
                            return 0;
                        }
                    });
                }).then(function(index) {
                    return _syncSurveyByPage(index, questionData);
                });
        }

        self.SyncAttachments = function() {
            Timer.start('Synchronize', 'Resources', 'issueattachment');

            return UserResourceDB.getByType($rootScope.user.userId, 'issueattachment')
                .then(function(data) {
                    data = data || {};
                    return _syncAttachmentsByPage(1, data.timeStamp, data.id);
                }).then(function() {
                    Timer.end('Synchronize', 'Resources', 'issueattachment');
                });
        };

        function _syncAttachmentsByPage(index, timeStamp, id) {
            if (index === 0) {
                return;
            }
            return apiService.retrieveData($rootScope.user.sessionId, "issueattachment", timeStamp, index)
                .then(function(response) {
                    if (index === 1) {
                        var data = {
                            timeStamp: response.data.status.currentTimestamp,
                            resourceType: 'issueattachment',
                            userId: $rootScope.user.userId,
                            id: id
                        };
                        UserResourceDB.AddOrUpdate(data);
                    }

                    return $q.all(response.data.response.map(function(attachment) {
                        if (attachment.filename !== null && attachment.status !== 'D') {
                            var fileNameReversed = attachment.filename.split('').reverse();
                            var indexOfDot = fileNameReversed.indexOf('.');
                            var ext = '';
                            if (indexOfDot > 0) {
                                ext = fileNameReversed.slice(0, indexOfDot).reverse().join('');
                            }
                            return AttachmentDB.add({
                                attachmentId: attachment.id,
                                ext: ext,
                                data: attachment.thumbnail,
                                bigData: attachment.picture,
                                surveyId: attachment.surveyID,
                                orgId: attachment.ownerID
                            }).catch(function(e) {
                                console.log(e);
                            });
                        }
                    })).then(function() {
                        var status = response.data.status;
                        if (status.page < status.totalPages) {
                            return status.page + 1;
                        } else {
                            return 0;
                        }
                    });
                }).then(function(index) {
                    return _syncAttachmentsByPage(index, timeStamp);
                });
        }

        self.delay = function delay(sec) {
            var deferred = $q.defer();
            $interval(function() {
                deferred.resolve(true);
            }, sec * 1000, false);
            return deferred.promise;
        };

        self.SyncAppResources = function() {
            Timer.start('Synchronize', 'Resources', 'App');
            return $q.all([
                __synchronizeResource(AppResourceDB.getByType, "errormessages", apiService.getErrorMessage, AppResourceDB.AddOrUpdate).then(function(data) {
                    Timer.end('Synchronize', 'Resources', 'errormessages');
                    if (angular.isArray(data)) {
                        if (data) {
                            data.forEach(function(item) {
                                $rootScope.Messages[item.token] = item.message;
                            });
                        }
                    }
                }),
                __synchronizeResource(AppResourceDB.getByType, "GetTemplates", apiService.getTemplates, AppResourceDB.AddOrUpdate).then(function() {
                    Timer.end('Synchronize', 'Resources', 'GetTemplates');
                })
            ]).then(function() {
                Timer.end('Synchronize', 'Resources', 'App');
            });
        };

        self.SyncOrgResources = function() {
            Timer.start('Synchronize', 'Resources', 'Org');

            function dbInvoker(resourceType) {
                return OrgResourceDB.getByType($rootScope.user.orgId, resourceType);
            }

            var resources = ['category', 'location', 'jobtype', 'errormessages', 'checklist', 'question'];

            return $q.all(
                resources.map(function(resource) {
                    return __synchronizeResource(dbInvoker, resource, function(timeStamp) {
                        return apiService.retrieveData($rootScope.user.sessionId, resource, timeStamp);
                    }, OrgResourceDB.AddOrUpdate).then(function(data) {
                        Timer.end('Synchronize', 'Resources', resource);
                        return data;
                    });
                })).then(function(data) {
                var errormessages = data[3];
                errormessages.forEach(function(item) {
                    $rootScope.Messages[item.token] = item.message;
                });
            }).then(function() {
                Timer.end('Synchronize', 'Resources', 'Org');
            });
        };



        self.SyncNotifications = function() {
            function dbInvoker(resourceType) {
                return UserResourceDB.getByType($rootScope.user.userId, resourceType);
            }

            return __synchronizeResource(dbInvoker, "notification", function(timeStamp) {
                return apiService.retrieveData($rootScope.user.sessionId, "notification", timeStamp);
            }, UserResourceDB.AddOrUpdate).then(function() {
                Timer.end('Synchronize', 'Resources', 'notification');
            });
        };

        self.CleanDb = function() {
            return $q.all([OrgResourceDB.deleteAll($rootScope.user.orgId), 
                UserResourceDB.deleteAll($rootScope.user.userId), 
                AppResourceDB.deleteAll(), 
                AttachmentDB.deleteByOrgId($rootScope.user.orgId),
                SurveyDB.deleteByUserId($rootScope.user.userId)]);
        };

        self.SyncUserResources = function() {
            Timer.start('Synchronize', 'Resources', 'User');

            return self.SyncNotifications()
                .then(self.SyncAttachments)
                .then(self.SyncSurveys)
                .then(function() {
                    Timer.end('Synchronize', 'Resources', 'survey');
                    Timer.end('Synchronize', 'Resources', 'User');
                });
        };

        self.InitializeBackgroundSynchronizer = function() {
            self.timerEnabled = true;
            $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
        };

        self.DisableBackgroundSynchronizer = function() {
            self.timerEnabled = false;
        };

        self.__synchronize = function() {
            if ($rootScope.isOnline && self.timerEnabled && $rootScope.user && $rootScope.user.userId) {

                if ($state.is('app.survey') || $state.is('app.assignedSurvey')) {
                    $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 6 * 1000);
                    return;
                }

                return self.SyncQueue()
                    .then(function() {
                        if (!$rootScope.SyncError) {
                            self.SyncOrgResources()
                                .then(self.SyncUserResources)
                                .then(function() {
                                    $rootScope.$broadcast('Synchronized', $rootScope);
                                    $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
                                });
                        }
                    }).catch(function(e) {
                        $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
                    });
            } else {
                $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
            }

        };

        function _SyncQueue() {
            return QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) {
                        return ProcessQueue().then(function() {
                            if ($rootScope.SyncError) {
                                return false;
                            }
                            return _SyncQueue();
                        });
                    }
                });
        }

        self.SyncQueue = function() {
            var deferred = $q.defer();

            $rootScope.SyncError = false;

            if ($rootScope.isOnline) {
                if (!$rootScope.isQueueProcessing) {
                    $rootScope.syncDeferred = deferred;
                    $rootScope.isQueueProcessing = true;
                    _SyncQueue()
                        .then(function() {
                            // if ($rootScope.SyncError) {
                            //     //Opportunity to return a message to end user over here
                            // }
                            $rootScope.isQueueProcessing = false;
                            deferred.resolve(true);
                        });
                } else {
                    deferred = $rootScope.syncDeferred;
                }
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        };

        function ProcessQueue() {
            return QueueDB.getTopItem($rootScope.user.userId)
                .then(function(queueItem) {
                    return apiService.__post(JSON.parse(queueItem.message))
                        .then(function(data) { //then will ensure - irrespective of success/error message will always be deleted
                            return QueueDB.delete(queueItem.id);
                        }).catch(function(e) {
                            $rootScope.SyncError = true;
                            return false;
                        });
                });
        }
        return self;
    }

    Synchronizer.$inject = ['$rootScope', 'QueueDB', 'OrgResourceDB', 'AppResourceDB', 'UserResourceDB', 'SurveyDB', 'Timer', 'apiService', '$q', '$timeout', '$interval', 'AttachmentDB', '$state', '$ionicPopup'];
    angular.module('healthApp.services').factory('Synchronizer', Synchronizer);
}());