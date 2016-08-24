(function () {
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AppResourceDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, resourceType, resource, timeStamp FROM AppResource WHERE resourceType = ?;",
                "INSERT": "INSERT INTO AppResource (resource, timeStamp, resourceType) VALUES (?, ?, ?);",
                "DELETEALL": "DELETE FROM AppResource",
                "UPDATEBYRESOURCE": "UPDATE AppResource SET resource = ?, timeStamp = ? WHERE resourceType = ?"
            };
        
        self.getByType = function (type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType]);
        };

        self.deleteAll = function() {
            return DB.query(QUERIES.DELETEALL);
        };

        return self;
    }

    AppResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('AppResourceDB', AppResourceDB);

}());

