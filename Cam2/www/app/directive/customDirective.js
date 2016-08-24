angular.module('starter').directive('custom', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        require: ['ngModel'],
        link: function (scope, element, attrs, ctrls) {
            var model = ctrls[0], form = ctrls[1];
            scope.next = function () {
                return model.$valid
            }

            scope.$watch(scope.next, function (newValue, oldValue) {
                if (newValue && model.$dirty) {
                    var nextinput = element.next('input');
                    if (nextinput.length == 1) {
                        nextinput[0].focus(true);
                    }
                }
            })
        }
    }
}]);