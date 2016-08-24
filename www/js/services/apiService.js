(function () {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function apiService (url, $http, QueueDB) {
        var self = this;

        self.__post = function(data) {
            return $http({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)){
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        }
                    }
                    return str.join("&");
                },
                data: data
            });
        };

        self.login = function(userid, password) {
            return self.__post({
                app: "RPHEALTH",
                request: "Login",
                username: userid,
                password: password,
                build : "1.9.6"
            });
        };

        self.switchOrganization = function(sessionId, orgId) {
            return self.__post({
                request: "SwitchOrganization",
                sessionId: sessionId,
                orgId: orgId
            });
        };

        self.retrieveData = function(sessionId, dataSource, timestamp, page) {
            return self.__post({
                request: "RetrieveData",
                sessionId: sessionId,
                datasource: dataSource,
                timestamp: timestamp,
                page : page
            });
        };

        self.getTemplates = function(sessionId, timestamp) {
            return self.__post({
                app: "RPHEALTH",
                request: "GetTemplates",
                sessionId: sessionId,
                timestamp: timestamp
            });
        };

        self.sync = function(userId, sessionId, identifier, datasource, action, object) {
            var message = {
                request: "Sync",
                sessionId: sessionId,
                identifier: identifier,
                datasource: datasource,
                action: action,
                object: object
            };

            QueueDB.push(userId, JSON.stringify(message));
        };

        self.getErrorMessage = function() {
            return self.__post({
                app: "RPHEALTH",
                request: "GetErrorMessages",
                datasource: "errormessages",
            });
        };

        self.getMoreInfo = function(sessionId, questionId) {
            return self.__post({
                request: "GetMoreInfo",
                questionID: questionId,
                sessionId: sessionId
            });
        };

        return self;
    }

    apiService.$inject = ['url', '$http', 'QueueDB'];
    angular.module('healthApp.services').factory("apiService", apiService);
}());

