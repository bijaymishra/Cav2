angular.module('starter').directive('dynamicSlides', function() {
    return {
        require: ['^ionSlideBox'],
        link: function(scope, elem, attrs, slider) {
            scope.$watch(function() {
                return scope.$eval(attrs.dynamicSlides).length;
            }, function(val) {
                slider[0].__slider.update();

            });
        }
    };
});