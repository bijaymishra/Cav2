(function () {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AttachmentDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYSURVEYID": "SELECT attachmentId, ext, data FROM Attachment WHERE surveyId = ?;",
                "DELETEBYID": "DELETE FROM Attachment WHERE attachmentId = ?;",
                "DELETEBYSURVEYID": "DELETE FROM Attachment WHERE surveyId = ?;",
                "DELETEBBYORGID": "DELETE FROM Attachment WHERE orgId = ?",
                "INSERT": "INSERT INTO Attachment (attachmentId, ext, data, bigData, surveyId, orgId) VALUES (?, ?, ?, ?, ?, ?);",
                "SELECTBIGPICTUREBYID": "SELECT bigData, ext FROM Attachment WHERE attachmentId = ?;"
            };

        self.getBySurveyId = function(surveyId) {
            return DB.fetchAll(QUERIES.SELECTBYSURVEYID, [surveyId]);
        };

        self.getBigPictureById = function(attachmentId){
            return DB.fetchOne(QUERIES.SELECTBIGPICTUREBYID, [attachmentId]);
        };

        self.deleteByOrgId = function(orgId) {
            return DB.query(QUERIES.DELETEBBYORGID, [orgId]);
        };

        self.deleteById = function(attachmentId) {
            return DB.query(QUERIES.DELETEBYID, [attachmentId]);
        };

        self.deleteBySurveyId = function(surveyId) {
            return DB.query(QUERIES.DELETEBYSURVEYID, [surveyId]);
        };

        self.add = function(data) {
            return DB.query(QUERIES.INSERT, [data.attachmentId, data.ext, data.data, data.bigData, data.surveyId, data.orgId]);
        };

        return self;
    }

    AttachmentDB.$inject = ['DB'];

    angular.module('healthApp.services').factory('AttachmentDB', AttachmentDB);
}());

    