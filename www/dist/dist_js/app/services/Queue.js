(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QueueDB(DB, $q) {
        var self = this,
            QUERIES = {
                "SELECTTOP": "SELECT id, userId, message FROM Queue WHERE userId = (?) ORDER BY id LIMIT 1;",
                "INSERT": "INSERT INTO Queue (userId, message) VALUES (?, ?);",
                "DELETEBYID": "DELETE FROM Queue WHERE id = (?)",
                "COUNTBYUSERID": "SELECT COUNT(*) as Count FROM Queue WHERE userId = (?);"
            };

        self.getTopItem = function(userId) {
            return DB.fetchOne(QUERIES.SELECTTOP, [userId]);
        };

        self.delete = function(id) {
            return DB.query(QUERIES.DELETEBYID, [id]);
        };

        self.length = function(userId) {
            return DB.fetchOne(QUERIES.COUNTBYUSERID, [userId])
                .then(function(data) {
                    return data.Count;
                });
        };

        self.push = function(data) {
            return DB.query(QUERIES.INSERT, [data.userId, data.message]);
        };

        return self;
    }

    QueueDB.$inject = ['DB', '$q'];
    
    angular.module('healthApp.services').factory('QueueDB', QueueDB);

}());