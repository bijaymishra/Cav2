(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return i;
                }
            }
            return -1;
        };
    }

    angular.module('healthApp.templates', []);
    angular.module('healthApp', ['ngIOS9UIWebViewPatch', 'ionic', 'ion-affix', 'sly', 'ngSanitize', 'healthApp.templates', 'healthApp.controllers', 'healthApp.services', 'ngCordova'])
        .run(['$ionicPlatform', '$cordovaSQLite', '$rootScope', '$ionicPopup',
            '$timeout', '$ionicHistory', 'DB', 'Synchronizer',
            'QueueProcessorService', 'ActivityMonitor', 'Analytics', '$window', 'Messages', 'Timer', 'SecuredPopups', '$ionicBackdrop',
            function($ionicPlatform, $cordovaSQLite, $rootScope, $ionicPopup,
                $timeout, $ionicHistory, DB, Synchronizer,
                QueueProcessorService, ActivityMonitor, Analytics, $window, Messages, Timer, SecuredPopups, $ionicBackdrop) {

                ionic.on('native.keyboardshow', onShow, window);
                ionic.on('native.keyboardhide', onHide, window);

                //deprecated
                ionic.on('native.showkeyboard', onShow, window);
                ionic.on('native.hidekeyboard', onHide, window);

                function onShow(e) {
                  if (ionic.Platform.isAndroid() && !ionic.Platform.isFullScreen) {
                    return;
                  }
                  $rootScope.keyboardHeight = Number.parseInt(e.keyboardHeight || e.detail.keyboardHeight);
                  $rootScope.$broadcast('keyboard-height', $rootScope.keyboardHeight);
                }

                function onHide(e) {
                  if (ionic.Platform.isAndroid() && !ionic.Platform.isFullScreen) {
                    return;
                  }
                  $rootScope.keyboardHeight = 0;
                  $rootScope.$broadcast('keyboard-height', $rootScope.keyboardHeight);
                }
            
                $rootScope.fullLength = function(str){
                    var str1 = (str || '') + '', exp = /\n/g;
                    return str1.length + ((str1.match(exp)||[]).length);
                };

                $rootScope.Messages = {};
                Messages.forEach(function(item) {
                    $rootScope.Messages[item.Key] = item.Value;

                });
                 
                function toggleCon(e) {
                    var isOnline = (e.type !== "offline");
                    if ($rootScope.isOnline != isOnline) {
                        $rootScope.isOnline = isOnline;
    
                        if ($rootScope.isOnline ) {
                            if (!$window.isOnlineMessageQueued) {

                                $window.isOnlineMessageQueued = true;
                                SecuredPopups.showConditional("alert", {
                                        title: 'Online',
                                        template: 'Your device is now online',
                                        scope: $rootScope
                                    }, function(){
                                        return $rootScope.isOnline;
                                    }).then(function(){
                                        $window.isOnlineMessageQueued = false;
                                    });
                            }
                        } else {
                            if (!$window.isOfflineMessageQueued) {
                                $window.isOfflineMessageQueued = true;
                                SecuredPopups.showConditional("alert", {
                                        title: 'Offline',
                                        template: 'Your device is now offline',
                                        scope: $rootScope
                                    }, function(){
                                        return !$rootScope.isOnline;
                                    }).then(function(){
                                        $window.isOfflineMessageQueued = false;
                                    });
                            }
                        }
                    }
                }


                $ionicPlatform.ready(function() {
                    navigator.splashscreen.hide();
                     if ($window.cordova && $window.cordova.plugins.Keyboard) {
                        $window.cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                        $window.cordova.plugins.Keyboard.disableScroll(true);
                    }
                    if ($window.StatusBar) {
                        $window.StatusBar.styleDefault();
                    }

                    if ($window.cordova) {
                        $rootScope.isOnline = ($window.navigator.connection.type !== $window.Connection.NONE);
                    } else {
                        $rootScope.isOnline = $window.navigator.onLine;
                    }

                    try {
                        $window.addEventListener("online", toggleCon, false);
                        $window.addEventListener("offline", toggleCon, false);
                        Analytics.init();
                        Analytics.captureDeviceInfo();
                                     
                    } catch (e) {

                    }
                                     /*
                                      
                                      * This block of code is device specific to handle keyboard on orientation change.
                                      
                                      */
                                     
                                     var deviceInfo = Analytics.getDeviceInformation();
                                     
                                     //alert('true' + deviceInfo.version);
                                     
                                    if(parseInt(deviceInfo.version) < 9 && deviceInfo.platform == "iOS"){
                                     
                                     //alert('true' + deviceInfo.model);
                                     
                                     $rootScope.iphone4Orientation = 'true';
                                     
                                     }
                                     
                                     
                                     
                                     /*
                                      
                                      * This code to reload keyboard on orientation change in ios devices.
                                      
                                      */
                                     
                                     if($rootScope.iphone4Orientation == 'true'){
                                     
                                     $window.addEventListener('orientationchange', reloadKeyboardOnly, false);
                                     
                                     }
                                     
                                     function reloadKeyboardOnly(){
                                     
                                     //alert($rootScope.isVisible + "Orientation changed");
                                     
                                     if($rootScope.isVisible){
                                     
                                     var focused = document.activeElement;
                                     
                                     
                                     
                                     document.activeElement.blur();
                                     
                                     event.stopImmediatePropagation();
                                     
                                     $timeout(function() {
                                              
                                              focused.focus();
                                              
                                              // e.stopPropogation();
                                              
                                              },900);
                                     
                                     }
                                     
                                     
                                     
                                     }
                      //DB encryption 
              var keyInfo = Analytics.getDeviceInformation();
              //$rootScope.encrypted = keyInfo.uuid;
              function padString(source) {
                            var paddingChar = ' ';
                            var size = 16;
                            var x = source.length % size;
                            var padLength = size - x;
                            
                            for (var i = 0; i < padLength; i++) source += paddingChar;
                            
                            return source;
                        }

                        var key = CryptoJS.enc.Hex.parse(keyInfo.uuid);
                        var iv  = CryptoJS.enc.Hex.parse(keyInfo.model);
                        var message = "readyPoint";
                        var padMsg = padString(message);

                        $rootScope.encrypted = CryptoJS.AES.encrypt(padMsg, key, { iv: iv, padding: CryptoJS.pad.NoPadding, mode: CryptoJS.mode.CBC});
                        
                                     
                                     

                                     
                    DB.init()
                        .then(function() {
                            QueueProcessorService.init();
                            ActivityMonitor.init();
                            Synchronizer.SyncAppResources();
                        });

                    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
                        if ((fromState.name === "app.quickAction" ||
                                toState.name === "app.quickAction" ||
                                toState.name === "app.assignedSurvey" ||
                                toState.name === "app.quickSurvey") ||
                            (fromState.name === "app.quickSurvey" &&
                                toState.name === "app.survey") || (fromState.name === "login" && toState.name === "intro")) {
                            $ionicHistory.nextViewOptions({
                                historyRoot: true
                            });
                        }

                        Analytics.trackEvent({
                            category: 'UI',
                            action: 'View-Transition',
                            label: 'From-To',
                            value: fromState.name + ' - ' + toState.name
                        });
                        Analytics.trackView(toState.name);
                        Timer.start('View-Transition', fromState.name, toState.name);
                    });

                    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                        Timer.end('View-Transition', fromState.name, toState.name);
                    });
                });
            }
        ])
        .config(['$compileProvider', '$stateProvider', '$urlRouterProvider', '$ionicConfigProvider',
            function($compileProvider, $stateProvider, $urlRouterProvider, $ionicConfigProvider) {

                //Disable Debug information
                $compileProvider.debugInfoEnabled(false);

                //Disable swipe back
                $ionicConfigProvider.views.swipeBackEnabled(false);

                var templatePath = "templates/";

                $stateProvider
                    .state('app', {
                        url: "/app",
                        cache: false,
                        abstract: true,
                        templateUrl: templatePath + "app.html",
                        controller: 'AppCtrl'
                    })
                    .state('app.quickSurvey', {
                        url: "/quickSurvey",
                        cache: true,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "quickSurvey.html",
                                controller: 'QuickSurveyCtrl',
                                resolve: {
                                    questionMap: function(Synchronizer, $rootScope) {
                                        return Synchronizer.getOrgQuestionMap($rootScope.user.orgId);
                                    },
                                    checklists: function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'checklist')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    },
                                    locations: function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }
                                }
                            }
                        }
                    })
                    .state('app.quickIssue', {
                        url: "/quickIssue",
                        cache: true,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "quickIssue.html",
                                controller: 'QuickIssueCtrl',
                                resolve: {
                                    categories: function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'category')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    },
                                    locations: function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }
                                }

                            }
                        }
                    })
                    .state('app.assignedSurvey', {
                        url: "/assignedSurvey",
                        cache: false,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "assignedSurvey.html",
                                controller: 'AssignedSurveyCtrl'
                            }
                        }
                    })
                    .state('app.notifications', {
                        url: "/notifications",
                        cache: true,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "notifications.html",
                                controller: 'NotificationsCtrl'
                            }
                        }
                    })
                    .state('app.quickAction', {
                        url: "/quickAction",
                        cache: true,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "quickAction.html",
                                controller: 'QuickActionCtrl'
                            }
                        }
                    })
                    .state('app.survey', {
                        url: "/survey/:surveyId",
                        cache: true,
                        views: {
                            'menuContent': {
                                templateUrl: templatePath + "survey.html",
                                controller: 'SurveyCtrl'
                            }
                        }
                    })
                    .state('synchronize', {
                        url: '/synchronize/:isLogin',
                        cache: false,
                        templateUrl: templatePath + "synchronize.html",
                        controller: 'SynchronizeCtrl'
                    })
                    .state('login', {
                        url: "/login",
                        templateUrl: templatePath + "login.html",
                        controller: 'LoginCtrl'
                    })
                    .state('intro', {
                        url: "/intro",
                        templateUrl: templatePath + "intro.html",
                        controller: 'introCtrl'
                    });

                // if none of the above states are matched, use this as the fallback
                $urlRouterProvider.otherwise('/login');

            }
        ]);

}());