(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function exceptionHandler(Analytics, $window) {

        $window.onerror = function(message, url, line, col, error) {
            var stopPropagation = true;
            var data = {
                type: 'javascript',
                url: window.location.hash,
                localtime: Date.now()
            };
            if (message) {
                data.message = message;
            }
            if (url) {
                data.fileName = url;
            }
            if (line) {
                data.lineNumber = line;
            }
            if (col) {
                data.columnNumber = col;
            }
            if (error) {
                if (error.name) {
                    data.name = error.name;
                }
                if (error.stack) {
                    data.stack = error.stack;
                }
            }
            //console.log(data);
            //alert(JSON.stringify(data));
            Analytics.trackException(JSON.stringify(data), true);
            return stopPropagation;
        };


        return function(exception, cause) {

            var data = {
                type: 'angular',
                url: window.location.hash,
                localtime: Date.now()
            };
            if (cause) {
                data.cause = cause;
            }
            if (exception) {
                if (exception.message) {
                    data.message = exception.message;
                }
                if (exception.name) {
                    data.name = exception.name;
                }
                if (exception.stack) {
                    data.stack = exception.stack;
                }
            }

            //console.log(data);
            //alert(JSON.stringify(data));
            Analytics.trackException(JSON.stringify(data), false);

        };
    }

    exceptionHandler.$inject = ['Analytics', '$window'];
    angular.module('healthApp.services').factory('$exceptionHandler', exceptionHandler);
}());