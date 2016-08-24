(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function UserResourceDB(DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, userId, resourceType, resource, timeStamp FROM UserResource WHERE userId = ? AND resourceType = ?;",
                "INSERT": "INSERT INTO UserResource (resource, timeStamp, resourceType, userId) VALUES (?, ?, ?, ?);",
                "DELETEBYUSERID": "DELETE FROM UserResource WHERE userId = ?",
                "DELETEBYUSERIDRESOURCETYPE": "DELETE FROM UserResource WHERE userId = ? AND resourceType = ?;",
                "UPDATEBYRESOURCE": "UPDATE UserResource SET resource = ?, timeStamp = ? WHERE resourceType = ? AND userId = ?"
            };

        self.getByType = function(userId, type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [userId, type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType, data.userId]);
        };

        self.deleteAll = function(userId) {
            return DB.query(QUERIES.DELETEBYUSERID, [userId]);
        };

        self.deleteByType = function(userId, type) {
            return DB.query(QUERIES.DELETEBYUSERIDRESOURCETYPE, [userId, type]);
        };

        return self;
    }

    UserResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('UserResourceDB', UserResourceDB);

}());