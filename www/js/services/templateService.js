(function () {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function templateService($templateCache) {

        function __cacheTemplates(data) {
            data.forEach(function(item){
                $templateCache.put(item.key, item.template);
            });
        }

        return {
            addTemplatesToCache: function (data) {
                return __cacheTemplates(data);                
            }
        };
    }

    templateService.$inject = ['$templateCache'];
    angular.module('healthApp.services').factory('templateService', templateService);
}());