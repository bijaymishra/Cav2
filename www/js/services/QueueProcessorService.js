(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QueueProcessorService (Synchronizer, $rootScope) {
        var self = this;

        self.init = function() {
            $rootScope.$on('MESSAGE_ADDED', function() {
                if ($rootScope.user && $rootScope.user.userId) {
                    Synchronizer.SyncQueue();
                }
            });

            $rootScope.$on('machineOnline', function() {
                if ($rootScope.user && $rootScope.user.userId) {
                    Synchronizer.SyncQueue();
                }
            });
        };

        return self;
    }

    QueueProcessorService.$inject = ['Synchronizer', '$rootScope'];
    angular.module('healthApp.services').factory('QueueProcessorService', QueueProcessorService);
    
}());

