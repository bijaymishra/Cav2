(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function queryService () {

            var map = {};

            function setQuery(name, func) {
                map[name] = func;
            }

            function removeQuery(name) {
                delete map[name];
            }

            function executeQuery(name) {
                if (map[name]) {
                    return map[name]();
                }
            }

            return {
                setQuery: setQuery,
                executeQuery: executeQuery,
                removeQuery: removeQuery
            };
        }

    queryService.$inject = [];
    
    angular.module('healthApp.services').factory('queryService', queryService);
    
}());

