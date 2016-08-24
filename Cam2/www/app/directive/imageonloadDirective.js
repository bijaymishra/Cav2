angular.module('starter').directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                       scope.showSlider = true;
                        element.parent().find('ion-spinner').remove();
            });

        }
    };
});