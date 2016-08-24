(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    function DB($q, DB_CONFIG, $window,$rootScope) {

        var db;

        function init() {
            db = $window.cordova ?sqlitePlugin.openDatabase({
                name: DB_CONFIG.name,
                location: 2,
                key: $rootScope.encrypted
            }) :sqlitePlugin.openDatabase({name: "DB_CONFIG.name", key: $rootScope.encrypted}); //$window.openDatabase(DB_CONFIG.name, '1.0', "database", -1);

            return $q.all(
                DB_CONFIG.tables.map(function(table) {
                    var columns = table.columns.map(function(column) {
                        return column.name + ' ' + column.type;
                    });
                    var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
                    return execute(query);
                })
            );
        }

        function execute(query, bindings) {
            bindings = typeof bindings !== 'undefined' ? bindings : [];
            var deferred = $q.defer();
            db.transaction(function(tx) {
                tx.executeSql(query, bindings, function(tx, result) {
                        deferred.resolve(result);
                    },
                    function(transaction, error) {
                        deferred.reject(error);
                    });
            });
            return deferred.promise;
        }

        function fetchAll(query, bindings) {
            return execute(query, bindings)
                .then(function(result) {
                    var output = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        output.push(result.rows.item(i));
                    }
                    return output;
                });
        }

        function fetchOne(query, bindings) {
            return execute(query, bindings)
                .then(function(result) {
                    return result.rows.length > 0 ? result.rows.item(0) : null;
                });
        }

        return {
            init: init,
            query: execute,
            fetchAll: fetchAll,
            fetchOne: fetchOne
        };
    }

    DB.$inject = ['$q', 'DB_CONFIG', '$window','$rootScope'];
    angular.module('healthApp.services').factory('DB', DB);

}());