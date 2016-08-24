(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    angular.module('healthApp')
        .directive('textEdit', ['$cordovaKeyboard', 
            function($cordovaKeyboard) {
                return {
                    restrict: 'E',
                    transclude: true,
                    template: "<div class='textEdit' ng-click='showModal()' readonly> {{data}} </div>",
                    scope: {
                        data: '=',
                        title: '=',
                        maxlength: '=',
                        ngChange: '&'
                    },
                    replace: true,
                    require: 'ngModel',
                    controller: ['$scope', '$ionicModal', '$templateCache', '$rootScope','$ionicBackdrop', '$cordovaDevice', '$timeout',
                       function($scope, $ionicModal, $templateCache, $rootScope,$ionicBackdrop, $cordovaDevice, $timeout) {
                            var t = $templateCache.get('templates/textedit.html');

                          /*  var device = $cordovaDevice.getDevice();
                            $scope.platform = device.platform;
                            $scope.version = Number.parseInt(device.version);
                            $scope.model = device.model;*/

                            $scope.modal = $ionicModal.fromTemplate(t, {
                                scope: $scope, // Use our scope for the scope of the modal to keep it simple
                                animation: 'no-animation' // The animation we want to use for the modal entrance
                            });

                            $scope.getValue = function() {
                                return $scope.data;
                            };

                            $scope.fullLength1 = function(str) {
                                var str1 = (str || '') + '',
                                    exp = /\n/g;
                                return str1.length + ((str1.match(exp) || []).length);
                            };

                            $scope.showModal = function() {
                                $scope.datatemp = $scope.data;
                                //document.activeElement.blur();
                                $scope.isVisible = true;
                                 $rootScope.isVisible = true;
                                 $scope.keyboardHeight = $rootScope.keyboardHeight;
                                 $scope.windowHeight = $(window).height();
                                $scope.modal.show();
                                $cordovaKeyboard.open();
                            };

                            $rootScope.$on('keyboard-height', function(e){
                                $timeout(function(){
                                    $scope.keyboardHeight = $rootScope.keyboardHeight;
                                    $scope.windowHeight = $(window).height();
                                }, 0);
                            });

                            $scope.Cancel = function() {
                                 $ionicBackdrop.retain();
                                 $timeout(function(){
                                     $ionicBackdrop.release();
                                     $cordovaKeyboard.close();
                                          },300);
                                $scope.datatemp = $scope.data;
                                $scope.isVisible = false;
                                 $rootScope.isVisible = false;
                                $scope.modal.hide();
                                $cordovaKeyboard.close();
                                 
                            };

                            $rootScope.$on('logout', function() {
                                if ($scope.isVisible) {
                                    $scope.modal.hide();
                                }
                            });


                            $scope.Save = function() {
                                 $ionicBackdrop.retain();
                                 $timeout(function(){
                                          $ionicBackdrop.release();
                                          $cordovaKeyboard.close();
                                          },300);
                                $scope.data = $scope.datatemp;
                                $timeout($scope.ngChange, 0);
                                $scope.isVisible = false;
                                 $scope.showRequired = true;
                                 $rootScope.isVisible = true;
                                $scope.modal.hide();
                                $cordovaKeyboard.close();
                                 
                            };
                        }
                    ]
                };
            }
        ])
        .directive('dropdown', ['$document', '$window', '$timeout',
            function($document, $window, $timeout) {
                return {
                    restrict: "E",
                    transclude: true,
                    template: "<div class='dropdown' ng-cloak><div ng-click='show = !show' class='dropdown-selector' ng-class='{glow: show}'>" +
                        "<span ng-class='[cssClass, {grayed: !dropdownModel}]'>{{dropdownPlaceholder}}</span>" +
                        "<div class='arrow-down'></div>" +
                        "</div>" +
                        "<div ng-hide='!show' ng-cloak class='ng-hide dropdown-wrapper' ng-style='{ width: dropDownWidth}'>" +
                        "<search search-model='searchText' class='searchbox' placeholder=''></search> " +
                        "<div ng-hide='noRecords' class='ng-hide center'>No Records</div> " +
                        "<ion-scroll direction='y' delegate-handle='drop-down-scroll'>" +
                        "<ul class='box' ng-transclude></ul>" +
                        "</ion-scroll>" +
                        "</div></div>",
                    scope: {
                        dropdownModel: "=",
                        dropdownPlaceholder: '=',
                        cssClass: '='
                    },
                    controller: ['$scope', '$ionicScrollDelegate',
                        function($scope, $ionicScrollDelegate) {
                            $scope.show = false;
                            $scope.selectedElem = null;

                            this.setModel = function(text, value) {
                                $scope.dropdownModel = value;
                                $scope.dropdownPlaceholder = text;
                                $scope.show = false;
                                $scope.searchText = '';
                            };
                            this.getModelValue = function() {
                                return $scope.dropdownModel;
                            };

                            $scope.$watch('searchText', function(text) {
                                if ($ionicScrollDelegate.$getByHandle('drop-down-scroll')) {
                                    $ionicScrollDelegate.$getByHandle('drop-down-scroll').scrollTop();
                                }
                            });

                            this.setSelectElem = function(elem) {
                                if ($scope.selectedElem) {
                                    $scope.selectedElem.removeClass('selected');
                                }
                                $scope.selectedElem = elem;
                                $scope.selectedElem.addClass('selected');
                            };
                        }
                    ],
                    link: function(scope, element, attrs) {
                        scope.noRecords = 1;

                        function findChildWithClass(element, className) {
                            for (var i = element.children().length - 1; i >= 0; i--) {
                                var child = angular.element(element.children()[i]);

                                if (child.hasClass(className)) {
                                    return child;
                                }
                            }
                        }

                        var dropDown = findChildWithClass(element, 'dropdown');

                        scope.$watch(
                            function() {
                                return dropDown[0].offsetWidth;
                            },
                            function(newValue, oldValue) {
                                if (newValue != oldValue && newValue != '0') {
                                    $timeout(function() {
                                        scope.$apply(function() {
                                            scope.dropDownWidth = newValue + 'px';
                                        });
                                    });
                                }
                            }
                        );

                        $window.addEventListener("orientationchange", function() {
                           $timeout(function() {
                            if (dropDown.prop('offsetWidth') != '0') {
                                scope.$apply(function() {
                                    scope.dropDownWidth = dropDown[0].offsetWidth + 'px';
                                });
                            }
                        }, 400);
                        }, true);

                        if (dropDown.prop('offsetWidth') != '0') {
                            scope.dropDownWidth = dropDown.prop('offsetWidth') + 'px';
                        }

                        // element.bind("focusout", function(e) {
                        //     scope.show = false;
                        //     scope.searchText = '';
                        // });

                        scope.$watch('searchText', function(text) {
                            if (text !== undefined) {
                                var totalRecords = 0,
                                    visibleRecords = 0;
                                angular.forEach(element.find('dropdown-item'), function(item) {
                                    totalRecords++;
                                    var itemSpan = angular.element(item).find('span')[0];
                                    var itemHtml = itemSpan.innerHTML;
                                    itemHtml = itemHtml.replace('<b>', '').replace('</b>', '');
                                    var i = itemHtml.toLowerCase().indexOf(text.toLowerCase());
                                    if (text !== '' && i === -1) {
                                        item.hidden = true;
                                    } else {
                                        visibleRecords++;
                                        item.hidden = false;
                                        itemSpan.innerHTML = itemHtml.substring(0, i) + "<b>" + itemHtml.substring(i, i + text.length) + "</b>" + itemHtml.substring(i + text.length);
                                        //is_group = false;
                                    }
                                });
                                scope.noRecords = visibleRecords > 0;
                            }
                        });

                        $document.bind('click', function(e) {
                            var element = e.srcElement;
                            var elementScope = e.srcElement ? angular.element(e.srcElement).scope() : null;
                            var elementId = elementScope ? elementScope.$id : null;
                            if (elementId !== scope.$id) {
                                scope.show = false;
                                scope.searchText = '';
                                scope.$apply();
                            }
                        });
                    }
                };
            }
        ])
        .directive('dropdownItem', function() {
            return {
                restrict: "E",
                transclude: true,
                require: "^dropdown",
                template: "<li ng-transclude ng-click='setValue()'></li>",
                scope: {
                    value: "=",
                    label: "="
                },
                link: function(scope, elem, attrs, dropdown) {
                    var value = dropdown.getModelValue();
                    if (scope.value === value) {
                        dropdown.setModel(scope.label, scope.value);
                    }
                    scope.setValue = function() {
                        dropdown.setModel(elem.text(), scope.value);
                        dropdown.setSelectElem(elem);
                    };
                },
            };
        })
        .directive('search', function() {
            return {
                restrict: "E",
                scope: {
                    placeholder: "@",
                    searchModel: "="
                },
                template: '<div class="search" ng-cloak>' +
                    '   <div class="left">' +
                    '       <div class="search-icon"></div>' +
                    '   </div>' +
                    '   <div class="right">' +
                    '  <form action="."> ' +
                    '       <input class="search-input" type="search" return-close="true" ng-model="searchModel" placeholder="{{placeholder}}">' +
                    ' </form> ' +
                    '   </div>' +
                    '   <div style="clear:both;"></div>' +
                    '</div>',
                link: function(scope, elem, attrs, dropdown) {
                    elem.bind('click', function(e) {
                        e.stopPropagation();
                    });
                },
            };
        })
        .directive('focus', ['$timeout',
            function($timeout) {
                return {
                    retrict: "A",
                    link: function(scope, element, attrs) {
                        scope.$watch(attrs.focus, function(currentValue, lastValue) {
                            if (currentValue) {
                                $timeout(function() {
                                    $(element[0]).focus();
                                    if ($(element[0]).hasClass("clickFocus")) {
                                        $(element[0]).click();
                                    }
                                });
                            }
                        });
                    }
                };
            }
        ])
        .directive('blurOnTop', ['$ionicScrollDelegate', '$timeout',
            function($ionicScrollDelegate, $timeout) {
                return {
                    restrict: 'A',
                    link: function(scope, iElement, iAttrs) {
                        var value = iAttrs.blurOnTop || 145;

                        function looseFocus() {
                            var elementTop = $(iElement[0]).offset().top;
                            if (elementTop && elementTop < value) {
                                iElement[0].blur();
                            }
                        }

                        function looseFocusScroll() {
                            $timeout(function() {
                                var elementTop = $(iElement[0]).offset().top;
                                if (elementTop && elementTop < value) {
                                    iElement[0].blur();
                                    var distance = (value - elementTop);
                                    $ionicScrollDelegate.scrollBy(0, -distance, false);
                                }
                            }, 100);
                        }
                        scope.$on('survey-scrolling', looseFocus);
                        iElement.bind('focus', looseFocusScroll);
                    }
                };
            }
        ])
        .directive('scrollUpward', ['$ionicScrollDelegate',
            function($ionicScrollDelegate) {
                return {
                    restrict: 'A',
                    link: function(scope, iElement, iAttrs) {
                        var handle = iAttrs.delegateHandle;
                        var currentPosition = 0;
                        var previousPosition = 0;
                        iElement.bind('scroll', function() {

                            if ($(window).height() > 800) {
                                scope.$parent.movingUpwards = false;
                                scope.$parent.staticHeader = true;
                                return;
                            }

                            scope.$parent.staticHeader = false;

                            currentPosition = $ionicScrollDelegate.$getByHandle(handle).getScrollPosition().top;
                            if (previousPosition && Math.abs(previousPosition - currentPosition) > 160) {
                                scope.$parent.$apply(function() {
                                    if (currentPosition < 160) {
                                        scope.$parent.movingUpwards = false;
                                    } else if (currentPosition > previousPosition) {
                                        scope.$parent.movingUpwards = true;
                                    } else {
                                        scope.$parent.movingUpwards = (previousPosition - currentPosition) > 160 ? false : scope.$parent.movingUpwards;
                                    }

                                });
                            }

                            if (Math.abs(previousPosition - currentPosition) > 160) {
                                previousPosition = currentPosition;
                            }

                        });
                    }
                };
            }
        ])
        .directive('input', function($timeout) {
            return {
                restrict: 'E',
                scope: {
                    'returnClose': '=',
                    'onReturn': '&'
                },
                link: function(scope, element, attr) {
                    element.bind('keydown', function(e) {
                        if (e.which == 13) {
                            if (scope.returnClose) {
                                element[0].blur();
                            }
                            if (scope.onReturn) {
                                $timeout(function() {
                                    scope.onReturn();
                                });
                            }
                        }
                    });
                }
            };
        })
        .directive('scrollOnClick', ['$ionicScrollDelegate', '$rootScope', '$ionicPosition', '$timeout',
            function($ionicScrollDelegate, $rootScope, $ionicPosition, $timeout) {
                return {
                    restrict: 'A',
                    require: '^$ionicScroll',
                    link: function(scope, iElement, iAttrs, $ionicScroll) {
                        iElement.bind('click', function(e) {

                            function findSiblingWithClass(element, className) {
                                var parent = element.parent();
                                for (var i = parent.children().length - 1; i >= 0; i--) {
                                    var sibling = angular.element(parent.children()[i]);

                                    if (sibling.hasClass(className)) {
                                        return sibling;
                                    }
                                }
                            }
                            var row = angular.element(ionic.DomUtil.getParentWithClass(iElement[0], 'survey-row-content'));
                            var pos = ionic.DomUtil.getPositionInParent(row[0]);
                            var top = pos.top;
                            var container = angular.element($ionicScroll.element);
                            var handle = container[0].attributes['delegate-handle'].value;
                            var openElement = findSiblingWithClass(row, 'isCurrent');
                            if (openElement) {
                                var pos1 = ionic.DomUtil.getPositionInParent(openElement[0]);
                                if (pos1.top < top) {
                                    top = top - openElement.prop('offsetHeight') + angular.element(openElement.children()[0]).prop('offsetHeight');
                                    shouldAddDelay = true;
                                }
                            }

                            if ($ionicScrollDelegate.$getByHandle(handle)) {
                                $ionicScrollDelegate.$getByHandle(handle).scrollTo(0, top, true);
                                if (scope.item) {
                                    scope.item.topPosition = top;

                                }
                            }
                        });
                    }
                };
            }
        ]);
}());