(function () {
    'use strict';

   
    angular.module('starter').factory('globalsearchService', function($q, $timeout, $rootScope) {
         $rootScope.recentdata = [

        ];
    var searchrecent = function(searchFilter) {
         
        
        
        
        var recentdata = $rootScope.recentdata;
       
        var deferred = $q.defer();

        var matches = recentdata.filter( function(recentdata) {
            if(searchFilter.length>=3)
            {
            if(recentdata.name.toLowerCase().indexOf(searchFilter.toLowerCase()) !== -1 ) return true;
            }
        })

        $timeout( function(){
        
           deferred.resolve( matches );

        }, 100);

        return deferred.promise;
         
    };

    return {

        searchrecent : searchrecent

    }
})


})();