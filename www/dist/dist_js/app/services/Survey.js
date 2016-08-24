(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SurveyDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTSUMMARY": "SELECT surveyId, checklist, location, dueDate, _status FROM Survey WHERE userId = ?;",
                "SELECTBYID": "SELECT json FROM Survey WHERE userId = ? AND surveyId = ?;",
                "INSERT": "INSERT INTO Survey (surveyId, tempId, userId, checklistID, checklist, locationID, location, dueDate, _status, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                "DELETEBYID": "DELETE FROM Survey WHERE userId = ? AND (surveyId = ? OR tempId = ?);",
                "DELETEBYUSERID": "DELETE FROM Survey WHERE userId = ?;",
                "UPDATEBYSURVEYID": "UPDATE Survey SET checklist = ?, location = ?, dueDate = ?, _status = ?, json = ? WHERE (surveyId = ? OR tempId = ?)"
            };

        self.getSummary = function(userId) {
            return DB.fetchAll(QUERIES.SELECTSUMMARY, [userId]);
        };

        self.getById = function(userId, surveyId) {
            return DB.fetchOne(QUERIES.SELECTBYID, [userId, surveyId]);
        };

        self.update = function(data) {
            return DB.query(QUERIES.UPDATEBYSURVEYID, [data.checklist, data.location, data.dueDate, data._status, data.json, data.surveyId, data.tempId]);
        };

        self.add = function(data) {
            return DB.query(QUERIES.INSERT, [data.surveyId, data.tempId, data.userId, data.checklistID, data.checklist, data.locationID, data.location, data.dueDate, data._status, data.json]);
        };

        self.deleteById = function(userId, surveyId) {
            return DB.query(QUERIES.DELETEBYID, [userId, surveyId, surveyId]);
        };

        self.deleteByUserId = function(userId) {
            return DB.query(QUERIES.DELETEBYUSERID, [userId]);
        };

        return self;
    }

    SurveyDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('SurveyDB', SurveyDB);

}());