(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function OrgResourceDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, orgId, resourceType, resource, timeStamp FROM OrgResource WHERE orgId = ? AND resourceType = ?;",
                "INSERT": "INSERT INTO OrgResource (resource, timeStamp, resourceType, orgId) VALUES (?, ?, ?, ?);",
                "DELETEALLBYORGID": "DELETE FROM OrgResource WHERE orgId = ?",
                "UPDATEBYRESOURCE": "UPDATE OrgResource SET resource = ?, timeStamp = ? WHERE resourceType = ? AND orgId = ?"
            };
        
        self.getByType = function (orgId, type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [orgId, type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType, data.orgId]);
        };
        
        self.deleteAll = function(orgId) {
            return DB.query(QUERIES.DELETEALLBYORGID, [orgId]);
        };

        return self;
    }

    OrgResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory("OrgResourceDB", OrgResourceDB);

}());



