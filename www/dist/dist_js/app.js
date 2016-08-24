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
                                    questionMap: ['Synchronizer', '$rootScope', function(Synchronizer, $rootScope) {
                                        return Synchronizer.getOrgQuestionMap($rootScope.user.orgId);
                                    }],
                                    checklists: ['OrgResourceDB', '$rootScope', function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'checklist')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }],
                                    locations: ['OrgResourceDB', '$rootScope', function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }]
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
                                    categories: ['OrgResourceDB', '$rootScope', function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'category')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }],
                                    locations: ['OrgResourceDB', '$rootScope', function(OrgResourceDB, $rootScope) {
                                        return OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                                            .then(function(data) {
                                                return JSON.parse(data.resource);
                                            });
                                    }]
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
angular.module("healthApp.templates").run(["$templateCache", function($templateCache) {$templateCache.put("templates/additionalinfo.html","<ion-modal-view class=add-info-modal ng-class=\"{\'mod-height\':!selectedOrg.isSubscribed}\"><header class=\"bar bar-header\"><div class=title>More About This Question</div><button ng-click=closeAddiitonalInfo() class=modal-close></button></header><ion-content class=\"has-header has-footer padding add-info1\" delegate-handle=addInfo-scroll><p class=align-left><strong>{{additionalInfoQuestion.name}}</strong></p><div class=list><div class=\"item item-input\"><strong>Category:&nbsp;</strong>{{additionalInfoQuestion.category}}</div><div class=\"item item-input\"><strong>Description:&nbsp;</strong>{{additionalInfoQuestion.description}}</div><div class=\"item item-input\"><strong>Action Plan:&nbsp;</strong>{{additionalInfoQuestion.defaultActionPlan}}</div></div><h1 class=\"small-modal-title line ng-hide\" ng-show=selectedOrg.isSubscribed ion-affix data-affix-within-parent-with-class=add-info1>Linked Standards</h1><div ng-repeat=\"item in additionalInfoData\" ng-show=selectedOrg.isSubscribed class=ng-hide><p class=\"link-standards-main link-standards-main-title\"><strong>{{item.externalDisplayID}} - {{item.name}}</strong></p><div ng-repeat=\"subItem in item.subItems\"><p class=\"link-standards-main link-standards-secondary-title\"><strong>{{subItem.externalDisplayID}}</strong> - {{subItem.name}}</p><div ng-repeat=\"subSubItem in subItem.subItems\"><p class=\"link-standards-sub preserve\"><strong>{{subSubItem.externalDisplayID}}</strong> - {{subSubItem.name}}</p><div class=additional-info-bar><span class=col-25>FSA</span> <span class=col-14>MOS</span> <span class=col-14>CR</span> <span class=col-14>DOC</span> <span class=col-14>SC</span> <span class=col-14>ESP</span></div><div class=\"additional-info-bar bg-white\"><span class=col-25>{{subSubItem.extraInfo.fsa}}</span> <span class=col-14>{{subSubItem.extraInfo.mos}}</span> <span class=col-14>{{subSubItem.extraInfo.cr}}</span> <span class=col-14>{{subSubItem.extraInfo.doc}}</span> <span class=col-14>{{subSubItem.extraInfo.sc}}</span> <span class=col-14>{{subSubItem.extraInfo.esp}}</span></div></div></div></div><div ng-show=\"!(additionalInfoData.length || !isOnline) && selectedOrg.isSubscribed\" class=\"center ng-hide\">There are no Standards linked to this Question</div><div ng-hide=isOnline>{{wifiError}}</div><div ng-hide=isOffline>{{linkedStnd}}</div></ion-content><ion-footer-bar class=\"bar bar-footer modal-footer ng-hide\" ng-show=additionalInfoData.length><div class=title>© 2015 The Joint commission. Version effective September, 2015. Displayed under license.</div></ion-footer-bar></ion-modal-view>");
$templateCache.put("templates/app.html","<ion-side-menus><ion-side-menu-content edge-drag-threshold=true drag-content=true><ion-nav-bar class=\"bar bar-header\"><ion-nav-back-button></ion-nav-back-button><ion-nav-buttons side=left><button class=\"button button-icon icon-menu\" menu-toggle=left></button></ion-nav-buttons></ion-nav-bar><ion-nav-view name=menuContent style=padding-top:40px;></ion-nav-view><ion-footer-bar class=\"bar bar-footer\"><span class=title>Copyright © 2015 ReadyPoint Health, Inc. All rights reserved.</span></ion-footer-bar></ion-side-menu-content><ion-side-menu side=left><ion-content><div class=menu-sidebar style=padding-top:40px;><div class=menu-sidebar-logo><img src=images/readypoint-logo.svg alt=readypoint></div><ul class=my-home-list><li><a href=#/app/quickSurvey menu-toggle>Take a Quick Survey <span></span></a></li><li><a href=#/app/quickIssue menu-toggle>Report a Finding<div class=oval><div class=oval-character>F</div></div></a></li><li><a href=#/app/assignedSurvey menu-toggle>Take an Assigned Survey<div class=\"oval red\"><div class=oval-character>{{ resourcesCount[\'survey\']}}</div></div></a></li></ul><ul class=my-profile-list><li><a href=javascript:void(0)>MyProfile</a></li><li><a href=javascript:void(0) ng-click=toggleResetData()>{{selectedOrg.name}}<br>{{user.name}}</a></li><li ng-show=showResetData><a href=javascript:void(0) ng-click=synchronize() menu-toggle>Reset Data <i class=icon-refresh></i></a></li><li><a menu-toggle href=#/app/notifications>View Notifications <i class=icon-notify><span>{{resourcesCount[\'notification\']}}</span></i></a></li><li><a href=javascript:void(0) ng-click=help() menu-toggle>Help</a></li><li><a href=javascript:void(0) menu-toggle ng-click=logout()>Logout</a></li></ul></div></ion-content></ion-side-menu></ion-side-menus>");
$templateCache.put("templates/assignedSurvey.html","<ion-view view-title=Surveys><ion-nav-buttons side=right><a class=\"button button-icon icon-finding mrgp20\" href=#/app/quickIssue></a> <a class=\"button button-icon icon-home mrgp20\" href=#/app/quickAction></a></ion-nav-buttons><ion-content><ion-refresher pulling-text=\"Pull to refresh...\" on-refresh=doRefresh()></ion-refresher><div style=padding:0;><div class=\"row row-top responsive-md padding\"><div class=col-80><div class=\"list list-inset\"><label class=\"item item-input\"><form name=assignedSForm novalidate><input return-close=true type=search ng-model=query.search ng-model-options=\"{ updateOn: \'default blur\', debounce: { \'default\': 500, \'blur\': 0 } }\" placeholder=Search></form></label></div></div><div class=col-20><dropdown class=dropdown-assigned-survey css-class=\"query.status === \'Open\' ? \'open_color\' : \'draft_color\'\" dropdown-model=query.status dropdown-placeholder=\"\'Open\'\"><dropdown-item ng-repeat=\"st in status\" class={{st.css}} value=st.id label=st.name>{{st.name}}</dropdown-item></dropdown></div></div><div class=\"container text-center\" style=\"padding-top: 30px;\" ng-show=!displayMessage><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>Loading...</p></div><ion-list class=\"card assigned-surveys ng-hide\" ng-show=displayMessage><ion-item ng-repeat=\"item in filteredSurveys = (surveys | filter : searchFilterFunction | orderBy : \'dueDate\' )\" ng-class-even=\"\'even item item-button-right\'\" ng-class-odd=\"\'odd item item-button-right\'\" ng-href=#/app/survey/{{::item.surveyId}} item-width=100% item-height=105><span ng-class=\"::{bluetext: item._status == \'Open\', greentext: item._status == \'Draft\'}\" class ng-bind=::item.checklist></span><div class=item-location ng-bind=::item.location></div><button class=\"button button-clear button-icon icon-right\"></button><div class=item-date ng-bind=::item.dueDateDisplay></div></ion-item><div ng-show=\"!filteredSurveys.length && surveys.length\" class=\"center ng-hide\">No records found</div></ion-list><div class=\"ng-hide center\" ng-show=\"!surveys.length && displayMessage\">Currently there are no surveys assigned to you</div></div></ion-content></ion-view>");
$templateCache.put("templates/autoLogout.html","<ion-modal-view><header class=\"bar bar-header\"><div class=title>Auto Logout</div><button ng-click=autoLogoutClose() class=modal-close></button></header><ion-content class=\"has-header padding\"><label style=padding:20px;font-size:18px;>Due to inactivity system will automatically log out in {{logoutCounter}} sec</label><div class=padding><button class=\"button button-small\" ng-click=autoLogoutClose()>Continue Session</button> <button class=\"button button-small padding-left\" ng-click=logout()>Logout</button></div></ion-content></ion-modal-view>");
$templateCache.put("templates/defaultAnswer.html","<ion-modal-view><button ng-click=defaultAnswerModal.hide() class=modal-close></button><h1 class=line>Select Default Answer</h1><ul class=login-states><li><a ng-click=\"selectDefaultAnswer(\'C\')\">Compliant</a></li><li class=alt><a ng-click=\"selectDefaultAnswer(\'NA\')\">Not Applicable</a></li><li><a ng-click=\"selectDefaultAnswer(\'LU\')\">Leave Unanswered</a></li></ul></ion-modal-view>");
$templateCache.put("templates/imageZoom.html","<ion-modal-view class=\"image-modal has-header\"><a class=modal-close ng-click=imageZoom.hide()></a> <img ng-src={{zoomImageSrc}} class=fullscreen-image></ion-modal-view>");
$templateCache.put("templates/intro.html","<ion-view view-title=Intro hide-back-button=true cache-view=false class=intro-slider><ion-nav-bar class=bar-light><ion-nav-back-button></ion-nav-back-button></ion-nav-bar><ion-nav-buttons side=left><button class=\"button button-positive button-clear no-animation pdtop23\" ng-click=leftButtonClick()>{{leftButton}}</button></ion-nav-buttons><ion-nav-buttons side=right><button class=\"button button-positive button-clear no-animation pdtop23\" ng-click=rightButtonClick()>{{rightButton}}</button></ion-nav-buttons><ion-slide-box on-slide-changed=\"slideIndex = index;\"><ion-slide><img ng-if=\"slideIndex >=0 && slideIndex <=1\" src=images/0-Intro_9.25.15_Instructions.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=0 && slideIndex <=2\" src=images/1-Intro_9.25.15_LogIn.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=1 && slideIndex <=3\" src=images/2-Intro_9.25.15_MyHome.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=2 && slideIndex <=4\" src=images/3-Intro_9.25.15_MenuSideBar.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=3 && slideIndex <=5\" src=images/4-Intro_9.25.15_Survey.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=4 && slideIndex <=6\" src=images/5-Intro_9.25.15_Survey_layout.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=5 && slideIndex <=7\" src=images/6-Intro_9.25.15_Finding.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=6 && slideIndex <=8\" src=images/7-Intro_9.25.15_QuickSurvey.png></ion-slide><ion-slide><img ng-if=\"slideIndex >=7 && slideIndex <=9\" src=images/8-Intro_9.25.15_Notifications.png></ion-slide></ion-slide-box></ion-view>");
$templateCache.put("templates/login.html","<ion-view><header class=\"bar logo-header\"><img src=images/readypoint-logo.svg alt=readypoint></header><ion-content class=\"v-align scrolloff loginContent\"><div class=\"container loginform\"><form name=loginForm novalidate><div class=\"list login-form\"><label class=\"item item-input\"><input type=text placeholder=Email ng-model=loginData.username ng-trim=false></label> <label class=\"item item-input\"><input type=password placeholder=Password ng-model=loginData.password></label> <button class=\"button button-large\" focus=clicked ng-click=doLogin(loginForm)>Log In</button></div></form></div></ion-content><footer class=\"bar bar-footer\"><div class=title>Copyright © 2015 ReadyPoint Health, Inc. All rights reserved.</div></footer></ion-view>");
$templateCache.put("templates/notifications.html","<ion-view view-title=Notifications><ion-nav-buttons side=right><a class=\"button button-icon icon-finding mrgp20\" href=#/app/quickIssue></a> <a class=\"button button-icon icon-home mrgp20\" href=#/app/quickAction></a></ion-nav-buttons><ion-content><ion-refresher pulling-text=\"Pull to refresh...\" on-refresh=doRefresh()></ion-refresher><span class=fading-border></span><div class=\"container text-center\" style=\"padding-top: 30px;\" ng-show=!displayMessage><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>{{loadingMessage}}</p></div><ion-list show-delete=false class=\"ng-hide card notifications\" ng-show=\"displayMessage && notifications.length\" can-swipe=true><ion-item nav-clear ng-repeat=\"item in notifications track by item.id\" ng-class-even=\"\'even\'\" ng-class-odd=\"\'odd\'\"><div ng-bind=::item.message></div><div class=item-date ng-bind=::item.created></div><ion-option-button class=\"button-assertive icon ion-trash-a\" ng-click=\"delete(item, $index)\"></ion-option-button></ion-item><ion-infinite-scroll distance=2 on-infinite=loadMoreData() ng-if=moredata></ion-infinite-scroll></ion-list><div class=\"ng-hide center\" ng-show=\"displayMessage && !notifications.length\">Currently there are no notifications</div></ion-content><ion-footer-bar class=bar-subfooter><button class=\"button pull-right\" ng-click=deleteAll() ng-show=\"notifications.length >0\">Delete All</button></ion-footer-bar></ion-view>");
$templateCache.put("templates/orgSelect.html","<ion-modal-view><div class=fixedModalHeader><button ng-click=logout() class=modal-close></button><h1 class=line>Select Organization</h1></div><ion-content><ion-list class=login-states><li ng-repeat=\"org in organizations\" ng-class-even=\"\'alt\'\"><a ng-click=selectOrg(org)>{{org.name}}</a></li></ion-list></ion-content></ion-modal-view>");
$templateCache.put("templates/photoPicker.html","<ion-modal-view><ion-header-bar><h1 class=title>Choose an Actions</h1></ion-header-bar><ion-content><span class=fading-border></span><div class=list><div class=item><button id=picCamera class=ion-camera data-pack=default data-tags=photo data-ng-click=addImage($event)>Camera</button></div><div class=item><button id=picImage class=ion-images data-pack=default data-tags=photo data-ng-click=addImage($event)>Gallery</button></div></div></ion-content></ion-modal-view>");
$templateCache.put("templates/queueProcessing.html","<ion-modal-view><header class=\"bar bar-header\"><div class=title>{{Messages.MESSAGE_TITLE}}</div><button ng-click=autoLogoutClose() class=modal-close></button></header><ion-content class=\"has-header padding\"><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>{{Messages.MBL_SYNCING_LOGOUT}}</p></ion-content></ion-modal-view>");
$templateCache.put("templates/quickAction.html","<ion-view view-title=MyHome><ion-nav-buttons side=right><a class=\"button button-icon icon-finding mrgp20\" href=#/app/quickIssue></a> <a class=\"button button-icon icon-home mrgp20\" href=#/app/quickAction></a></ion-nav-buttons><ion-content class=\"v-align scrolloff\"><div class=\"container homecont\"><ul class=my-home-list><li><a href=#/app/quickSurvey>Take a Quick Survey <span></span></a></li><li><a href=#/app/quickIssue>Report a Finding<div class=oval><div class=oval-character>F</div></div></a></li><li><a href=#/app/assignedSurvey>Take an Assigned Survey<div class=\"oval red\"><div class=oval-character>{{ resourcesCount[\'survey\']}}</div></div></a></li></ul></div></ion-content></ion-view>");
$templateCache.put("templates/quickIssue.html","<ion-view view-title=\"Report a Finding\"><ion-nav-buttons side=right><a class=\"button button-icon icon-home mrgp20\" ng-href=#/app/quickAction></a></ion-nav-buttons><ion-content on-scroll=broadcastScroll()><div style=padding:0;><form name=quickIssueForm novalidate><div class=\"list card finding\"><div class=item><div class=\"row row-center responsive-md\"><div class=col-20><label>Category</label> <label class=\"red-text ng-hide\" ng-show=\"showRequired && !quickIssue.categoryID\">*</label></div><div class=\"col-80 posstatic\"><dropdown dropdown-model=quickIssue.categoryID dropdown-placeholder=\"\'Select Category\'\"><dropdown-item ng-repeat=\"c in categories | orderBy: \'name\'\" value=c.id label=c.name>{{c.name}}</dropdown-item></dropdown></div></div></div><div class=item><div class=\"row row-center responsive-md\"><div class=col-20><label>Location</label> <label class=\"red-text ng-hide\" ng-show=\"showRequired && !quickIssue.locationID\">*</label></div><div class=col-80><dropdown dropdown-model=quickIssue.locationID dropdown-placeholder=\"\'Select Location\'\"><dropdown-item ng-repeat=\"l in locations | orderBy: \'name\'\" value=l.id label=l.name>{{l.name}}</dropdown-item></dropdown></div></div></div><div class=item><div class=\"row row-center responsive-md\"><div class=\"col-20 reportLabel\"><label>Source</label></div><div class=col-80><div class=\"input-desc pull-right\">{{400 - fullLength(quickIssue.source)}}</div><text-edit data=quickIssue.source ng-model=quickIssue.source maxlength=400 title=\"\'Edit Source\'\"></text-edit></div></div></div><div class=item><div class=\"row row-center responsive-md DesRow\"><div class=\"col-20 reportLabel\"><label>Description</label> <label class=\"red-text ng-hide\" ng-show=\"showRequired && quickIssue.description == \'\'\">*</label></div><div class=col-80><div class=\"item item-checkbox item-checkbox-right ResolvCheck\">Resolved <label class=checkbox><input type=checkbox ng-model=quickIssue.resolved></label></div><div class=\"input-desc pull-right\">{{400 - fullLength(quickIssue.description)}}</div><text-edit data=quickIssue.description ng-model=quickIssue.description maxlength=400 required title=\"\'Edit Description\'\"></text-edit></div></div></div><div class=item><div class=\"row row-center responsive-md\"><div class=\"col-20 reportLabel\"><label>Action Plan</label></div><div class=col-80><div class=\"input-desc pull-right\">{{400 - fullLength(quickIssue.actionPlan)}}</div><text-edit data=quickIssue.actionPlan ng-model=quickIssue.actionPlan maxlength=400 title=\"\'Edit Action Plan\'\"></text-edit></div></div></div><div class=item><div class=\"row row-center responsive-md\"><div class=col-20><label>Take a Photo</label></div><div class=col-80><div class=\"row responsive-sm\"><div class=\"col col-30\"><div class=camera-box-wrapper><button ng-click=showAS(0) ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[quickIssue.showImage0]\"><span>1</span><i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[quickIssue.showImage0]\"></i></button></div><div class=\"photo-box ng-hide\" ng-show=quickIssue.showImage0><img square ng-src={{quickIssue.imgURI0}} ng-click=viewImages(0)> <a class=\"button button-icon icon-remove\" ng-click=removeImages(0) ng-show=quickIssue.showImage0></a></div></div><div class=\"col col-30\"><div class=camera-box-wrapper><button ng-click=showAS(1) ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[quickIssue.showImage1]\"><span>2</span><i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[quickIssue.showImage1]\"></i></button></div><div class=\"photo-box ng-hide\" ng-show=quickIssue.showImage1><img square ng-src={{quickIssue.imgURI1}} ng-click=viewImages(1)> <a class=\"button button-icon icon-remove\" ng-click=removeImages(1) ng-show=quickIssue.showImage1></a></div></div><div class=\"col col-30\"><div class=camera-box-wrapper><button ng-click=showAS(2) ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[quickIssue.showImage2]\"><span>3</span><i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[quickIssue.showImage2]\"></i></button></div><div class=\"photo-box ng-hide\" ng-show=quickIssue.showImage2><img square ng-src={{quickIssue.imgURI2}} ng-click=viewImages(2)> <a class=\"button button-icon icon-remove\" ng-click=removeImages(2) ng-show=quickIssue.showImage2></a></div></div></div></div></div></div></div><div class=padding><button class=\"button button-small\" ng-disabled=!isModified ng-click=cancel()>Cancel</button> <button class=\"button button-small pull-right\" ng-click=save(quickIssueForm)>Save</button></div></form></div></ion-content></ion-view>");
$templateCache.put("templates/quickSurvey.html","<ion-view view-title=\"Quick Survey\"><ion-nav-buttons side=right><a class=\"button button-icon icon-finding mrgp20\" href=#/app/quickIssue></a> <a class=\"button button-icon icon-home mrgp20\" href=#/app/quickAction></a></ion-nav-buttons><ion-content><div style=padding:0;><form name=quickSurveyForm novalidate><div class=\"list card finding quick-survey\"><div class=item><div class=\"row row-center responsive-md\"><div class=col-10><label>Checklist</label> <label class=\"red-text ng-hide\" ng-show=\"showRequired && !survey.checklistID\">*</label></div><div class=col-90><dropdown dropdown-model=survey.checklistID class=custom-select dropdown-placeholder=survey.checklistLabel><dropdown-item ng-repeat=\"c in checklists | orderBy: \'name\'\" value=c.id label=c.name>{{c.name}}</dropdown-item></dropdown></div></div></div><div class=item><div class=\"row row-center responsive-md\"><div class=col-10><label>Location</label> <label class=\"red-text ng-hide\" ng-show=\"showRequired && !survey.locationID\">*</label></div><div class=col-90><dropdown dropdown-model=survey.locationID class=custom-select dropdown-placeholder=survey.locationLabel><dropdown-item ng-repeat=\"loc in locations | orderBy: \'name\'\" value=loc.id label=loc.name>{{loc.name}}</dropdown-item></dropdown></div></div></div><div class=padding><button class=\"button button-small\" ng-click=clear()>Cancel</button> <button class=\"button button-small pull-right\" ng-click=start(quickSurveyForm)>Start</button></div></div></form></div></ion-content></ion-view>");
$templateCache.put("templates/resetData.html","<ion-view><header class=\"bar logo-header\"><img src=images/readypoint-logo.svg alt=readypoint></header><ion-content class=v-align><div><div class=\"container text-center\"><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>Please wait while loading your data...</p></div></div></ion-content><footer class=\"bar bar-footer\"><div class=title>Copyright © 2015 ReadyPoint Health, Inc. All rights reserved.</div></footer></ion-view>");
$templateCache.put("templates/survey.html","<ion-view view-title=Survey><ion-nav-buttons side=right><a class=\"button button-icon icon-finding mrgp20\" href=#/app/quickIssue></a> <a class=\"button button-icon icon-home mrgp20\" ng-href=#/app/quickAction></a></ion-nav-buttons><ion-content class=survey-content delegate-handle=survey-scroll scroll-upward on-scroll=broadcastScroll()><div ion-affix data-affix-within-parent-with-class=survey-content><div ng-hide=\"movingUpwards && !staticHeader\"><div class=subheader ng-click=hideTopBar()><div ng-click=hideTopBar()><h2 class=sub-title ng-click=hideTopBar()>{{survey.checklist}} <span>{{survey.location}}</span></h2></div></div><div class=searchrow><div class=searchrow-sm><div class=col_1><label class=\"item item-input\"><form name=surveyForm novalidate><input return-close=true type=search placeholder=Search ng-model=query.search ng-model-options=\"{ updateOn: \'default blur\', debounce: { \'default\': 1000, \'blur\': 0 } }\"></form></label></div></div><div class=btnrow-sm><div class=col_2><button class=\"button button-block\" ng-click=saveAsDraft()>Draft</button></div><div class=col_2><button class=\"button button-block\" ng-click=saveAsComplete()>Complete</button></div></div></div></div><div class=\"survey-row top-bar\"><div class=survey-bar-cell><div class=left-col><div class=small-col-c>C</div><div class=small-col-nc>N/C</div><div class=small-col-na>N/A</div></div></div><div class=\"survey-bar-cell right-col question-heading\">Question</div></div></div><div class=\"container text-center\" style=\"padding-top: 30px;\" sly-show=!displayMessage><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>{{loadingMessage}}</p></div><ion-list delegate-handle=survey-scroll><ion-item class=\"survey-row-content ng-hide\" id=question{{item.id}} sly-show=\"displayMessage && !item.hide\" ng-repeat=\"item in __filteredQuestions\" ng-class=\"{ isCurrent : item.isCurrent, \'alt\': item.isOdd }\"><div class=\"radio-row hr-seperator\"><div class=survey-bar-cell><div class=left-col><div class=\"small-col-c text-center green-text\" ng-bind=item.compliant()></div><div class=\"small-col-nc text-center red-text\" ng-bind=item.noncompliant()></div><div class=\"small-col-na text-center\" ng-bind=item.notApplicable()></div></div></div><div class=\"survey-bar-cell middle-col question-text\" scroll-on-click ng-click=selectQuestion(item);><p ng-bind-html=::item.name></p></div><div class=\"survey-bar-cell three-dots-wrapper\"><div class=right-col><a href=javascript:void(0); ng-hide=\"selectedOrg.isSubscribed && item.hasStandards\" class=survey-show-more ng-click=showAdditionalInfo(item)><i class=three-dots></i></a> <a href=javascript:void(0); ng-show=\"selectedOrg.isSubscribed && item.hasStandards\" class=survey-show-link ng-click=showAdditionalInfo(item)></a></div></div></div><div class=survey-collapse style=display:block; ng-repeat=\"answer in item._answers\" sly-show=\"(item.isCurrent && item.showAnswers ) || (item.isCurrent && $index === 0)\" ng-click=\"selectAnswer(item, answer);\" ng-class=\"{\'editSec\': $index}\"><div class=radio-row sly-show=\"(item.isCurrent && item.showAnswers && answer.isEditable) || (item.isCurrent && $index === 0)\"><div class=survey-bar-cell ng-show=\"(item.isCurrent && $index === 0)\"><div class=radio-buttons><div class=styled-radio ng-click=\"updateAnswer(answer,\'C\');\"><img class=icon src=images/radiobutton-checked.png ng-if=\"answer.compliant==\'C\'\"> <img class=icon src=images/radiobutton.png ng-if=\"answer.compliant !=\'C\'\"> <label for=yes-1 class=green-text>{{item.compliantAnswer}}</label></div><div class=styled-radio ng-click=\"updateAnswer(answer,\'NC\');\"><img class=icon src=images/radiobutton-checked.png ng-if=\"answer.compliant==\'NC\'\"> <img class=icon src=images/radiobutton.png ng-if=\"answer.compliant !=\'NC\'\"> <label for=no-1 class=red-text>{{item.compliantAnswer.toLowerCase() === \"yes\" ? \"No\" : \"Yes\"}}</label></div><div class=styled-radio ng-click=\"updateAnswer(answer,\'NA\');\"><img class=icon src=images/radiobutton-checked.png ng-if=\"answer.compliant==\'NA\'\"> <img class=icon src=images/radiobutton.png ng-if=\"answer.compliant !=\'NA\'\"> <label class=white-text for=na-1>N/A</label></div></div></div><div class=\"ng-hide survey-bar-cell\" ng-show=\"$index > 0\"><span><b>#{{item._answers.length - $index}}:</b></span> <span ng-show=\"answer.compliant === \'NC\'\">{{item.compliantAnswer.toLowerCase() === \"yes\" ? \"No\" : \"Yes\"}} (Non-Compliant)</span> <span ng-show=\"answer.compliant === \'C\'\">{{item.compliantAnswer.toLowerCase() === \"yes\" ? \"Yes\" : \"No\" }} (Compliant)</span> <span ng-show=\"answer.compliant === \'NA\'\">N/A (Not Applicable)</span></div><div class=\"survey-bar-cell job-type\" sly-prevent-evaluation-when-hidden sly-show=\"item.isUniqueID==\'Y\' || item.isJobType==\'Y\' || answer.compliant == \'NC\'\"><label ng-if=\"item.isJobType==\'Y\'\">Job Type</label> <label ng-if=\"item.isUniqueID==\'Y\'\">Unique Id</label><dropdown class=dropdown-width ng-if=\"item.isJobType==\'Y\'\" dropdown-model=answer.jobTypeID dropdown-placeholder=\"\'Select Job Type\'\"><dropdown-item ng-repeat=\"jt in jobTypes | orderBy: \'name\'\" value=jt.id label=jt.name>{{jt.name}}</dropdown-item></dropdown><input ng-if=\"item.isUniqueID==\'Y\'\" type=text ng-model=answer.uniqueID><div class=\"item item-checkbox item-checkbox-right resolved-btn\" ng-if=\"answer.compliant == \'NC\'\"><a ng-click=\"answer.issue.resolved = (answer.issue.resolved == \'N\'? \'Y\' : \'N\');\"><label>Resolved</label> <img style=\"height: 33px; width: 36px; display: inline-block; margin: 0px;\" class=icon src=images/RP_CheckMark_white.svg sly-show=\"answer.issue.resolved ==\'Y\' && $index === 0\"> <img style=\"height: 33px; width: 36px; display:inline-block;padding: 0 5px;\" class=icon src=images/RP_white_checkbox.svg sly-show=\"answer.issue.resolved ==\'N\' && $index === 0\"> <img style=\"height: 33px; width: 36px; display: inline-block; margin: 0px;\" class=icon src=images/RP_CheckMark_navy.svg sly-show=\"answer.issue.resolved ==\'Y\' && $index > 0\"> <img style=\"height: 33px; width: 36px; display:inline-block;padding: 0 5px;\" class=icon src=images/RP_white_checkbox.svg sly-show=\"answer.issue.resolved ==\'N\' && $index > 0\"></a></div></div></div><div class=prevent-evaluation sly-prevent-evaluation-when-hidden sly-show=\"$index > 0 && !answer.isEditable\"><div><span><b>#{{item._answers.length - $index}}:</b></span> <span ng-if=\"answer.compliant === \'NC\'\">{{item.compliantAnswer.toLowerCase() === \"yes\" ? \"No\" : \"Yes\"}} (Non-Compliant)</span> <span ng-if=\"answer.compliant === \'C\'\">{{item.compliantAnswer.toLowerCase() === \"yes\" ? \"Yes\" : \"No\" }} (Compliant)</span> <span ng-if=\"answer.compliant === \'NA\'\">N/A (Not Applicable)</span> <span class=detailCol ng-if=\"item.isJobType==\'Y\' && answer.jobTypeID\"><b>Job Type:</b> {{jobTypeById(answer.jobTypeID)}}</span> <span class=detailCol ng-if=\"item.isUniqueID==\'Y\' && answer.uniqueID\"><b>Unique Id:</b> {{answer.uniqueID}}</span> <span ng-if=\"answer.compliant === \'NC\'\" class=detailCol><b>Resolved:</b> {{answer.issue.resolved == \'N\'? \'No\' : \'Yes\'}}</span> <span ng-if=\"answer.compliant === \'NC\'\" class=detailCol><b>Photos:</b> {{ ((answer.issue.images.showImage0 && 1) || 0) + ((answer.issue.images.showImage1 && 1) || 0) + ((answer.issue.images.showImage2 && 1) || 0) }}</span> <span class=\"detailCol pull-right\">Updated: {{answer.updated}}</span></div><div class=description ng-if=answer.freeText><b>Description:</b> {{answer.freeText}}</div><div class=actionPlan ng-if=\"answer.compliant === \'NC\' && answer.issue.actionPlan\"><b>Action Plan:</b> {{answer.issue.actionPlan}}</div><div class=btn-container><button class=\"button button-small pull-right\" ng-click=\"makeAnswerEditable(item, answer)\">Edit</button> <button class=\"button button-small pull-right\" ng-click=\"deleteAnswer(item, answer);\">Delete</button></div></div><div class=btn-wrap sly-prevent-evaluation-when-hidden sly-show=\"$index === 0 && !answer.compliant\"><button ng-show=\"item.answers.length - 1\" class=\"ng-hide button button-small pull-right\" ng-click=showHideAnswers(item)>{{item.showAnswers ? \'Hide\' : \'Show\'}} <span class=\"oval red\">{{item.answers.length - 1}}</span></button> <button ng-show=\"(item.answers.length - 1) && ($index > 0)\" class=\"ng-hide button button-small pull-right\" ng-click=addAnswer(item);$event.stopPropagation();>Save</button></div><div sly-prevent-evaluation-when-hidden class=survey-row-description sly-show=\"($index === 0 && answer.isCurrent && answer.compliant) || (answer.isCurrent && !answer.isDummy && answer.isEditable)\"><div class=description-row><div class=description-row-left>Description<e class=\"red-text ng-hide\" sly-show=\"(!answer.freeText.length && answer.compliant == \'NC\' && answer.isCurrent && !answer.isDummy) || (!answer.freeText.length && answer.compliant == \'NC\' && answer.isCurrent && answer.isDummy && answer.isValidated)\">*</e><span>{{400 - fullLength(answer.freeText)}}</span></div></div><div class=description-row><div class=description-row-left><text-edit data=answer.freeText ng-model=answer.freeText maxlength=400 title=\"\'Edit Description\'\"></text-edit></div><div class=description-row-right><div class=description-row-right-content></div></div></div></div><div sly-prevent-evaluation-when-hidden class=survey-row-description sly-show=\"(($index === 0 && answer.isCurrent && answer.compliant) || (answer.isCurrent && !answer.isDummy && answer.isEditable)) && answer.compliant == \'NC\'\"><div class=description-row><div class=description-row-left>Action Plan <span>{{400 - fullLength(answer.issue.actionPlan)}}</span></div><div class=description-row-right><div class=description-row-right-content></div></div></div><div class=description-row><div class=description-row-left><text-edit data=answer.issue.actionPlan ng-model=answer.issue.actionPlan ng-change=\"item.actionPlan = answer.issue.actionPlan\" maxlength=400 title=\"\'Edit Action\'\"></text-edit></div><div class=description-row-right><div class=description-row-right-content></div></div></div></div><div sly-prevent-evaluation-when-hidden class=survey-row-photos sly-show=\"(($index === 0 && answer.isCurrent && answer.compliant) || (answer.isCurrent && !answer.isDummy && answer.isEditable)) && answer.compliant == \'NC\'\"><div class=photo-row-left><div class=photo-title>Take a photo</div></div><div class=photo-row-right><div class=\"row responsive-sm\"><div class=col><div class=camera-box-wrapper><button ng-click=\"showAS(answer, 0)\" ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[answer.issue.images.showImage0]\">1<i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[answer.issue.images.showImage0]\"></i></button></div><div class=photo-box sly-show=answer.issue.images.showImage0><img square ng-src={{answer.issue.images.imgURI0}} ng-click=\"viewImages(answer, 0)\" sly-show=answer.issue.images.showImage0> <a class=\"button button-icon icon-remove\" ng-click=\"removeImages(answer, 0)\" sly-show=answer.issue.images.showImage0></a></div></div><div class=col><div class=camera-box-wrapper><button ng-click=\"showAS(answer, 1)\" ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[answer.issue.images.showImage1]\">2<i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[answer.issue.images.showImage1]\"></i></button></div><div class=photo-box sly-show=answer.issue.images.showImage1><img square ng-src={{answer.issue.images.imgURI1}} ng-click=\"viewImages(answer, 1)\" sly-show=answer.issue.images.showImage1> <a class=\"button button-icon icon-remove\" ng-click=\"removeImages(answer, 1)\" sly-show=answer.issue.images.showImage1></a></div></div><div class=col><div class=camera-box-wrapper><button ng-click=\"showAS(answer, 2)\" ng-class=\"{false:\'button button-light button-camera\',true:\'button button-camera-blue\'}[answer.issue.images.showImage2]\">3<i ng-class=\"{false:\'icon icon-camera\',true:\'icon icon-camera-white\'}[answer.issue.images.showImage2]\"></i></button></div><div class=photo-box sly-show=answer.issue.images.showImage2><img square ng-src={{answer.issue.images.imgURI2}} ng-click=\"viewImages(answer, 2)\" sly-show=answer.issue.images.showImage2> <a class=\"button button-icon icon-remove\" ng-click=\"removeImages(answer, 2)\" sly-show=answer.issue.images.showImage2></a></div></div></div></div></div><div class=btn-wrap sly-prevent-evaluation-when-hidden sly-show=\"answer.isEditable || ($index === 0 && answer.compliant)\"><button class=\"button button-small\" ng-click=\"revertAnswer(item, answer)\">Cancel</button> <button class=\"button button-small\" ng-click=addAnswer(item);$event.stopPropagation();>Save</button> <button class=\"button button-small ng-hide\" ng-show=\"(item.answers.length - 1) && ($index === 0)\" ng-click=showHideAnswers(item)>{{item.showAnswers ? \'Hide\' : \'Show\'}} <span class=\"oval red\">{{item.answers.length - 1}}</span></button></div></div></ion-item></ion-list><div sly-show=\"!visibleRecords && displayMessage\" class=\"center ng-hide\">No records found</div><ion-infinite-scroll distance=2% on-infinite=loadMoreData() ng-if=\"__filteredQuestions.length < __Questions.length\"></ion-infinite-scroll></ion-content></ion-view>");
$templateCache.put("templates/synchronize.html","<ion-view><header class=\"bar logo-header\"><img src=images/readypoint-logo.svg alt=readypoint></header><ion-content class=\"v-align BKP scrolloff\"><div><div class=\"container text-center\"><p class=spinner><ion-spinner icon={{spinner}}></ion-spinner></p><p>{{loadingMessage}}</p></div></div></ion-content><footer class=\"bar bar-footer\"><div class=title>Copyright © 2015 ReadyPoint Health, Inc. All rights reserved.</div></footer></ion-view>");
$templateCache.put("templates/textedit.html","<ion-modal-view class=\"text-modal has-header has-footer top0\"><ion-content class=textareaPopup scroll=false><header class=\"bar bar-header\"><div class=title ng-bind=title></div></header><div class=popupTextareaContainer><div class=\"title textareatitle pull-left smallTitle\" ng-bind=title></div><div class=\"input-desc textCount pull-right\">{{maxlength - fullLength1(datatemp)}}</div><textarea autocomplete=off autocorrect=off autocapitalize=off spellcheck=false class=\"marginLR clickFocus\" focus=isVisible ng-model=$parent.$parent.$parent.datatemp maxlength={{maxlength}} rows=5></textarea></div><ion-footer-bar align-title=left keyboard-attach class=bar-assertive><div class=btnContainer><input class=\"button popupbtn pull-left\" type=button value=Cancel ng-click=Cancel()> <input class=\"button popupbtn pull-right\" type=button value=Save ng-click=Save()></div></ion-footer-bar></ion-content></ion-modal-view>");}]);
(function() {
   // "use strict";
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    angular.module('healthApp.config', [])
        //.constant('url', '/rest/V2/')
        //.constant('url', 'https://app2.readypointhealth.com/app/Services/rest/V2/')
        //.constant('url', 'https://qa.readypointhealth.com/app/Services/rest/V2/')
        .constant('url', 'https://app.readypointhealth.com/app/Services/rest/V2/')
        //.constant('url', 'http://dev.readypointhealth.com/app/Services/rest/V2/')
        .constant('GA_CODE', 'UA-62239388-2')
        .constant('Messages', [{
            "Key": "SURVEY_LOADING_TOO_LONG",
            "Value": "Survey you have selected has large number of questions, and will take more time to load."
        },{
            "Key": "SURVEY_LOADING",
            "Value": "Loading..."
        },{
            "Key": "MBL_SYNCING_LOGOUT",
            "Value": "You will be logged out when syncing is complete"
        }, {
            "Key": "RELOGIN_MESSAGE",
            "Value": "There was error during Syncrhonization, you will need to re-login into application"
        }, {
            "Key": "MESSAGE_TITLE",
            "Value": "Message"
        }, {
            "Key": "INTRO_SCREEN_INFO_MESSAGE",
            "Value": "The following intro will help guide you through ReadyPoint."
        }, {
            "Key": "INTRO_SCREEN_MESSAGE",
            "Value": "Do you want to see the introduction screens for future logins?"
        }, {
            "Key": "ANS_LOCKED_MESSAGE",
            "Value": "Delete your Answer and create a new one if you would like to change your Answer."
        }, {
            "Key" : "QUEUE_PROCESSING_ERROR",
            "Value" : "Error while processing your Queue, please contact your administrator. Your data will be synced only after your Queue has been processed."
        }, {
            "Key" : "QUEUE_PROCESSING_ERROR_LOGOUT",
            "Value" : "Error processing your Queue, please contact your administrator. Your Queue will be synced next time you log into application."
        }, {
            "Key": "ANS_LOCKED_TITLE",
            "Value": "Answer Locked"
        }, {
            "Key": "API_ERROR_MESSAGE",
            "Value": "Unable to connect to servers, please ensure you are connected to Wi-Fi."
        }, {
            "Key": "API_ERROR_TITLE",
            "Value": "Connection Error"
        }, {
            "Key": "AUTO_LOGGED_OUT",
            "Value": "You have been logged out due to inactivity. Log back in."
        }, {
            "Key": "CANCEL_MESSAGE",
            "Value": "Are you sure you want to clear your changes?"
        }, {
            "Key": "CANCEL_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "SURVEY_COMPLETED_MESSAGE",
            "Value": "Survey Completed"
        }, {
            "Key": "COMPLETE_TITLE",
            "Value": "Survey Completed"
        }, {
            "Key": "DELET_NOTIF_MESSAGE",
            "Value": "Are you sure you want to delete this notification?"
        }, {
            "Key": "DELETE_ANSWER",
            "Value": "Do you want to delete the answer?"
        }, {
            "Key": "DELETE_ANS_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELETE_ATTACH_MESSAGE",
            "Value": "Are you sure you want to remove this attachment?"
        }, {
            "Key": "DELETE_ATTACH_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELETE_NOTIF_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELTE_NOTIFICATIONS",
            "Value": "Are you sure you want to delete all Notifications?"
        }, {
            "Key": "DRAFT_MESSAGE",
            "Value": "Draft Survey information has been saved."
        }, {
            "Key": "DRAFT_TITLE",
            "Value": "Survey Drafted"
        }, {
            "Key": "ISSUE_SAVED",
            "Value": "Finding successfully saved."
        }, {
            "Key": "ISSUE_SAVED_TITLE",
            "Value": "Finding Saved"
        }, {
            "Key": "LOGGED_OUT",
            "Value": "You have successfully Logged out"
        }, {
            "Key": "LOGIN_FAIL_TITLE",
            "Value": "Login Failed"
        }, {
            "Key": "LOGOUT_TITLE",
            "Value": "Logged Out"
        }, {
            "Key": "NAV_CONFIRM_MESSAGE",
            "Value": "Do you want to navigate to another page?"
        }, {
            "Key": "NAV_CONFIRM_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "QUEUE_PEND_OFF_MESSAGE",
            "Value": "You have saved work from an out of WI-FI session. Before logging out, please connect to WI-FI to sync your data. Your data will not be lost, but it will not appear on the web portal until syncing is complete."
        }, {
            "Key": "QUEUE_PEND_ON_MESSAGE",
            "Value": "You have saved work from an out of WI-FI session. Your data is Synchronizing."
        }, {
            "Key": "QUEUE_PEND_TITLE",
            "Value": "Queue Sync Pending"
        }, {
            "Key": "REQ_FIELDS_MESSAGE",
            "Value": "Please fill out required fields"
        }, {
            "Key": "REQ_FIELDS_TITLE",
            "Value": "Required Fields"
        }, {
            "Key": "SYNC_FAIL_MESSAGE",
            "Value": "Unable to connect to servers, please ensure you are connected to Wi-Fi"
        }, {
            "Key": "SYNC_FAIL_TITLE",
            "Value": "Sync Failed"
        }, {
            "Key": "SYNC_MAN_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_MAN_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "SYNC_NOTIF_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_NOTIF_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "SYNC_OPT_MESSAGE",
            "Value": "Do you want to reset your data? If you would like to proceed, this synchronization could take up to 2 minutes because this is a comprehensive refresh that will update the application to the database."
        }, {
            "Key": "SYNC_OPT_TITLE",
            "Value": "Synchronize"
        }, {
            "Key": "SYNC_SURVEY_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_SURVEY_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "INITIAL_LOADING_MESSAGE",
            "Value": "Please wait while your data is syncing. Your loading time will be longer than usual because this is your first login."
        }, {
            "Key": "SYNC_LOADING_MESSAGE",
            "Value": "Please wait while loading your data..."
        }, {
            "Key": "SUBSEQ_LOADING_MESSAGE",
            "Value": "Please wait while loading your data..."
        }, {
            "Key": "WIFI_LINKED_STND_MESSAGE",
            "Value": "Connect to Wi-Fi to view any linked Standards."
        },{
            "Key": "REVRT_MESSAGE",
            "Value": "Do you want to revert the changes?"
        }, {
            "Key": "LOGOUT_ONLINE_DATA_IN_QUEUE",
            "Value": "You have saved work that will now be updated to server."
        }])
        .constant('DB_CONFIG', {
            name: 'healthApp_8.db',
            tables: [{
                name: 'Attachment',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'attachmentId',
                    type: 'text'
                }, {
                    name: 'orgId',
                    type: 'text'
                }, {
                    name: 'surveyId',
                    type: 'text'
                }, {
                    name: 'ext',
                    type: 'text'
                }, {
                    name: 'data',
                    type: 'text'
                }, {
                    name: 'bigData',
                    type: 'text'
                }]
            }, {
                name: 'Queue',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'message',
                    type: 'text'
                }]
            }, {
                name: 'Survey',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'surveyId',
                    type: 'text'
                }, {
                    name: 'tempId',
                    type: 'text'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'checklistID',
                    type: 'integer'
                }, {
                    name: 'checklist',
                    type: 'text'
                }, {
                    name: 'locationID',
                    type: 'integer'
                }, {
                    name: 'location',
                    type: 'text'
                }, {
                    name: 'dueDate',
                    type: 'text'
                }, {
                    name: '_status',
                    type: 'text'
                }, {
                    name: 'json',
                    type: 'text'
                }]
            }, {
                name: 'OrgResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'orgId',
                    type: 'integer'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }, {
                name: 'AppResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }, {
                name: 'UserResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }]
        });

}());
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
	
	angular.module('healthApp.controllers', ['healthApp.services']);
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function LoginCtrl($scope, $rootScope, 
            $state, $timeout, $location,
            $ionicModal, $ionicPopup, $ionicLoading, 
            apiService, $templateCache, templateService, Synchronizer, QueueDB, UserResourceDB, Analytics, SecuredPopups, AppResourceDB, DB) {

        /**
         * Function to register Modals to be used from AppController.
         * Namely - SelectOrganization Modal - to allow selecting Organization if Login has returned multiple Organization
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/orgSelect.html', {
                scope: $scope,
                animation: 'scale-in'
            }).then(function(modal) {
                $scope.selectOrganizationModal = modal;
            });

            // var t = $templateCache.get('orgSelect.html');

            // $scope.selectOrganizationModal = $ionicModal.fromTemplate(t, {
            //     scope: $scope, // Use our scope for the scope of the modal to keep it simple
            //     animation: 'slide-in-up' // The animation we want to use for the modal entrance
            // });
        }

        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.selectOrganizationModal.remove();
        }

        /**
         * Event Handler for Login Button Click
         * If Login is successful, 
         *     Check list of Organization returned. If only one Organization is returned select it and initiate Data Sync
         *     If Mutliple Organizations are returned, Provide user with dialog to select Organization
         */
        function onDoLogin(){
            $scope.clicked = new Date();
            
            apiService.login($scope.loginData.username, $scope.loginData.password)
                .then(function(response) {
                    var data = response.data;
                    if (data.status.success === "true") {
                        _getErrorMessages();
                        $scope.organizations = data.response.orgList;
                        $rootScope.user = {
                            name: $scope.loginData.username,
                            sessionId: data.response.sessionID
                        };
                        $rootScope.attempts = 0;

                        // //Below code shall be uncommented to load the latest templates from server
                        //apiService.getTemplates($rootScope.user.sessionId, null)
                        //    .success(function (data) {
                        //       templateService.addTemplatesToCache(data.response);
                        //   });

                        if ($scope.organizations.length === 1) {
                            onSelectOrg($scope.organizations[0]);
                        } else {
                            $scope.selectOrganizationModal.show();
                        }

                    } else {
                         var alertPopup = SecuredPopups.show('alert', {
                              title: $rootScope.Messages.MESSAGE_TITLE,
                            template: data.status.message
                           });
                    }
                })
                .catch(function(data) {
                    SecuredPopups.show('alert', {
                        scope: $scope,
                        title: $rootScope.Messages.MESSAGE_TITLE, 
                        template: $rootScope.Messages.API_ERROR_MESSAGE
                    });
                });
        }

        /**
         * Event Handler for Organization Selection
         * Capture configuration values returned by SwitchOrg API, and initiate Synchronization
         */
        function onSelectOrg(org) {

            $rootScope.selectedOrg = org;
            $rootScope.user.orgId = org.id;

            $scope.selectOrganizationModal.hide();

            apiService.switchOrganization($rootScope.user.sessionId, org.id)
                .then(function(response) {
                    $rootScope.user.userId = response.data.response.userID;
                    $rootScope.selectedOrg.isSubscribed = response.data.response.isSubscribed;
                    $rootScope.selectedOrg.gallery = response.data.response.gallery;
                    $rootScope.selectedOrg.timeout = response.data.response.schema.timeout;
                    $rootScope.selectedOrg.syncInterval = response.data.response.schema.syncInterval;
                    Analytics.setUserId($rootScope.user.userId); //GA Tracking
                    $rootScope.serviceRequests = response.data.response.schema.serviceRequests;
                    $state.transitionTo('synchronize', { isLogin : true });
                });
        }

        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        function onDestroy() {
            _unRegisterModals();
        }

        /**
         * Event Handler to be executed when User cancels Select Org Screen without selecting Organization
         */
        function onSelectOrgViewCanceled() {
            $scope.selectOrganizationModal.hide();
            $rootScope.$broadcast('logout');
            $location.path('/login');

        }

        /**
         * Event Handler to handle Logout Event
         * Disable Background Synchronization,
         * Clear Scope data
         * And popup alert to user with reason for Logout
         */
        function onLogout() {
            Synchronizer.DisableBackgroundSynchronizer();
            $rootScope.user = {};
            $scope.loginData.password = "";
            var message = $rootScope.UserActivityTimeout ? $rootScope.Messages.AUTO_LOGGED_OUT : $rootScope.Messages.LOGGED_OUT;
           /* $ionicPopup.alert({
                scope: $scope,
                title: $rootScope.Messages.LOGOUT_TITLE,
                template: message
            })*/
                    var logOutPopup = SecuredPopups.show('alert', {
                                      title: $rootScope.Messages.MESSAGE_TITLE,
                                      template: message
                                         });
        }

        /**
         * Get Pre-Login Error Messages
         */
        function _getErrorMessages() {
            $scope.emailAddress = $rootScope.Messages.ENTER_EMAIL_ADDRESS;
            $scope.msgDataPendingForSyncInQueue = $rootScope.Messages.YOUR_DATA_SYNCING_WEB_PORTAL;
            $scope.msg_OnLogout = $rootScope.Messages.LOGGED_OUT;
        }
        function _getlastLoggedInUser() {
            DB.init().then(function () {
                AppResourceDB.getByType("lastUser").then(function (data) {
                    $scope.loginData.username = data.resource.split('"').join('');                   
                });
            });
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            _getlastLoggedInUser();
            _registerModals();
            $scope.selectOrg = onSelectOrg;
            $rootScope.resources = {};
            $scope.loginData = {};
            $scope.loggedOut = false;
            $scope.initialLogin = "";
            $scope.subSequentLogin = "";
            $scope.emailAddress = "";

            $scope.doLogin = onDoLogin;
            $scope.logout = onSelectOrgViewCanceled;

            $scope.$on('$destroy', onDestroy);
            $rootScope.$on('logout', onLogout);
        }

        onInit();

    }

    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    LoginCtrl.$inject = ['$scope', '$rootScope', 
            '$state', '$timeout', '$location',
            '$ionicModal', '$ionicPopup', '$ionicLoading', 
            'apiService', '$templateCache', 'templateService', 'Synchronizer', 'QueueDB', 'UserResourceDB', 'Analytics', 'SecuredPopups', 'AppResourceDB', 'DB'];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('LoginCtrl', LoginCtrl);

}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    function AppCtrl($scope, $rootScope,
        $q, $state, $window, $timeout, $interval,
        $ionicLoading, $ionicModal, $ionicPopup,
        QueueDB, Synchronizer, Analytics, queryService, SecuredPopups) {
        /**
         * Function to register Modals to be used from AppController.
         * Namely - AutoLogoutModal - when user is idle for 'X' minutes. Where 'X' is hardcode currently to 30 mins
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/autoLogout.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.autoLogoutModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/queueProcessing.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.queueMoal = modal;
            });

            
        }
        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.autoLogoutModal.remove();
        }
       

        /**
         * Handler to reduce Count-down, once started
         * Apart from reducing Count-down, it also checks if Count-down has been completed
         * if Yes, it logouts user and redirects him/her to Login Screen
         * It Also, checks if there was any User Activity, and it needs to shut down the counter
         * and close Auto-Logout Modal View
         */
        var timerArray = [];

        function tick() {
            if ($rootScope.UserActivityTimeout) { //Check if there was User Activity,
                $scope.logoutCounter--; //Decrement the counter - it will be reflected on screen
                if ($scope.logoutCounter > 0) { //Check if Logout out counter has been completed
                    timerArray.push($timeout(tick, 1000));
                } else {
                    if ($rootScope.user && $rootScope.user.userId) {
                        /**
                         * Log Google Analytics Event for Auto-Logout
                         */
                        if (!$state.is('login')) {
                            Analytics.trackEvent({
                                category: "Authentication",
                                action: "Auto Logout",
                                label: "userid",
                                value: $rootScope.user.userId
                            });
                            $rootScope.$broadcast('logout'); //Lgout
                            $state.transitionTo('login'); //Redirect user to Login Screen
                        }
                    }
                }
            } else {
                $scope.autoLogoutClose(); //Since there was user Activity - shut down counter and close Auto-Logout View
            }
        }
        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        var cleanUserIdleHandler;

        function onDestroy() {
            _unRegisterModals();
            cleanUserIdleHandler();
        }
        
        /**
         * Event handler to be execute when user is idle
         * @param  {number} diff Provides number of minutes user has been Idle additional to upper limit set.
         * This number if greater than 1, user has idle and application was minimized, hence application was
         * not able to trigger this event
         * In case diff is not greater than 1, then it indicates application is active, show user count-down modal
         */
        function onUserIdle(event, diff) {
            timerArray.map(function(timerPromise) {
                //console.log("cancelling promise...");
                $timeout.cancel(timerPromise);
            });
            /**
             * Log Google Analytics Event for Logout
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "User Idle",
                label: "userid",
                value: $rootScope.user.userId
            });
            if (diff.value >= 0) {
                /**
                 * Log Google Analytics Event for Logout - When application was in Background and Activated
                 */
                if (!$state.is('login')) {
                    Analytics.trackEvent({
                        category: "Authentication",
                        action: "Auto Logout - Background",
                        label: "userid",
                        value: $rootScope.user.userId
                    });
                    onAutoLogoutClose();
                    $rootScope.$broadcast('logout'); //Logout
                    $state.transitionTo('login'); //Redirect user to Login Screen
                }
            } else {
                if (diff.value < 0 && diff.value >= -1) {
                    if (diff.resumedFromBg !== true) {
                        $scope.logoutCounter = 60;
                    } else {
                        $scope.logoutCounter = Math.round(Math.abs(diff.value) * 60);
                    }

                    timerArray.push($timeout(tick, 1000)); //Handler to reduce Countdown on every second
                    $scope.autoLogoutModal.show(); //Show countdown Modal View to User
                }
            }
        }
        /**
         * Event Handler to close Auto-Logout Countdown Window. Used by Auto-Logout Modal Popup
         * @return {[type]} [description]
         */
        function onAutoLogoutClose() {
            $scope.autoLogoutModal.hide();
        }

        /**
         * Event Handler to handle Loguout request by User - when he clicks on Logout link on sidemenu
         * @return {void}
         */
        function onLogout() {
            /**
             * Check if Survey page is allowing to logout. If Survey page has current answer as 'NC',
             * and answer is invalid then user cannot logout unless he has fixed the answer and saved it.
             */
            if (queryService.executeQuery('cannot-logout')) {
                return;
            }
            /**
             * Log Google Analytics Event for Logout
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Logout",
                label: "userid",
                value: $rootScope.user.userId
            });
            /**
             * Logout algorithm
             * If User tries to logout - check if he has any entries in Queue table.
             *     If Yes
             *         Check if application is Not Online
             *             If Yes
             *                 Warn user, it has unsaved data in Queue, and data will
             *                 not be lost but it will not be synced and he may not be
             *                 able to see it on Portal
             *             If No
             *                 Warn user, it has unsaved data in Queue, and data will be
             *                 synchronized before he logs out.
             *                 Synchronize Queue and then Logout
             *     If No
             *         Logout user, broadcast the Logut event
             *         Redirect user to Login Screen
             */
            QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) { //Are there any records in Queue
                        if (!$rootScope.isOnline) { //Is Application Online

                            SecuredPopups.show('confirm', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.QUEUE_PEND_OFF_MESSAGE
                            }).then(function(result) {
                                if (result) {
                                    $rootScope.$broadcast('logout'); //Logout
                                    $state.transitionTo('login'); //Redirect user to Login Screen
                                }
                            });
                        } else {
                            SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE, //'Queue Sync Pending',
                                //template: $rootScope.Messages.QUEUE_PEND_ON_MESSAGE, //'You have saved work from an out of WI-FI session. Your data is been Synchronized.'
                                template: $rootScope.Messages.LOGOUT_ONLINE_DATA_IN_QUEUE //'You have saved work  that will now be updated to server.'
                            }).then(function(res) {
                                if (res) {
                                    $scope.queueMoal.show();
                                }
                                Synchronizer.SyncQueue() 
                                    .then(function() {
                                    if ($rootScope.SyncError) { 
                                        $scope.queueMoal.hide();
                                        return SecuredPopups.show('alert', {
                                            title: $rootScope.Messages.MESSAGE_TITLE,
                                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR_LOGOUT
                                        });
                                    }
                                }).then(function() {
                                    $scope.queueMoal.hide(); //Hide In Progress Icon
                                    $rootScope.$broadcast('logout'); //Logout
                                    $state.transitionTo('login'); //Redirect User to Login Screen
                                });
                            });
                        }
                    } else {
                        $rootScope.$broadcast('logout'); //Logout
                        $state.transitionTo('login'); //Redirect User to Login Screen
                    }
                });
        }

        /**
         * Event handler for Help Menu Click
         */
        function onHelp() {
            /**
             * Log Google Analytics for invocation of Help
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Help",
                label: "userid",
                value: $rootScope.user.userId
            });
            $window.open('https://readypointhealth.uservoice.com/', '_system');
            return false;
        }
        /**
         * Event Handler for Synchronize Event, when user clicks on Synchronize Menu Option in Side-Menu
         * If Application is Offline, giving message to user, Synchronization cannot be initiated
         * Provide prompt to end user - if he would like to do clean Sync or would like to go partialy/differential Sync
         */
        function onSynchronize() {
            if (!$rootScope.isOnline) {
                return SecuredPopups.show('alert', {
                    title: $rootScope.Messages.MESSAGE_TITLE, 
                    template: $rootScope.Messages.SYNC_MAN_OFF_MESSAGE 
                });
            }
            /**
             * Log Google Analytics Event for Syncrhonization - due to user activity
             * @type {String}
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "Synchronize-Manual",
                label: "userid",
                value: $rootScope.user.userId
            });
            /**
             * Prompt user for full or differential Synchronization
             */
            
            var synOptPopup = SecuredPopups.show('alert', {
                template: $rootScope.Messages.SYNC_OPT_MESSAGE, //'Do you wish clean offline database and do complete data synchronize?',
                title: $rootScope.Messages.MESSAGE_TITLE, //'Synchronize',
                scope: $scope,
                buttons: [{
                    text: 'Yes',
                    type: 'button-positive',
                    onTap: function() { $state.transitionTo('synchronize', { isLogin : false }); }
                }, {
                    text: 'No',
                    type: 'button-positive'
                }]
            });
        }
        /**
         * During development or for some other reason, if application looses it state
         * this method will be executed and user will be redirected to Login Screen
         */
        function onStateCleared() {
            if (!$rootScope.user) {
                $state.transitionTo('login'); //Redirect to Login Screen
            }
        }
        
        /**
         * Display Logic for Toggling Reset Data
         */
        function onToggleResetData() {
            $scope.showResetData = ($scope.showResetData) ? false : true;
        }
        
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            _registerModals();
            /**
             * Event Handlers and Functions attached to $scope to be used in View
             */
            $scope.$on('$destroy', onDestroy);
            cleanUserIdleHandler = $rootScope.$on('UserIdle', onUserIdle);
            $scope.autoLogoutClose = onAutoLogoutClose;

            $rootScope.$watch('user', onStateCleared);
            $scope.logout = onLogout;
            $scope.help = onHelp;
            $scope.synchronize = onSynchronize;
            $scope.toggleResetData = onToggleResetData;
        }
        onInit();
    }
    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    AppCtrl.$inject = ['$scope', '$rootScope',
        '$q', '$state', '$window', '$timeout', '$interval',
        '$ionicLoading', '$ionicModal', '$ionicPopup',
        'QueueDB', 'Synchronizer', 'Analytics', 'queryService', 'SecuredPopups'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('AppCtrl', AppCtrl);
}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QuickActionCtrl() {}

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('QuickActionCtrl', [QuickActionCtrl]);

}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function NotificationsCtrl($scope, $rootScope,
        $ionicListDelegate, $ionicPopup, $timeout, $window, $filter,
        Synchronizer, PostService, UserResourceDB, SecuredPopups) {


        function IsOnline() {
            if ($window.cordova) {
                return ($window.navigator.connection.type !== $window.Connection.NONE);
            } else {
                return $window.navigator.onLine;
            }
        }

        
        /**
         * Load Notifications from Database
         */
        function loadNotificationFromDB() {
            return UserResourceDB.getByType($rootScope.user.userId, 'notification')
                .then(function(data) {
                    $scope._notifications = JSON.parse(data.resource)
                        .map(function(item) {
                            return {
                                id: item.id,
                                message: item.message,
                                created: moment(item.created).format('MM/DD/YYYY    hh:mm A'),
                                _created: new Date(moment(item.created).format('MM/DD/YYYY    hh:mm A'))
                            };
                        });
                    $scope._notifications = $filter('orderBy')($scope._notifications, '_created');
                    $scope.notifications = [];
                    $scope.displayMessage = true;
                    $scope.loadMoreData();
                });
        }

        $scope.loadMoreData = function() {
            for (var i = 0; i <= 30; i++) {
                if ($scope._notifications.length > 0){
                    var item = $scope._notifications.pop();
                    $scope.notifications.push(item);
                }
            }
            $scope.moredata = $scope._notifications.length > 0;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        };

        /**
         * Event Handler for Refresh Events
         * If User is Online
         *     Synchronizes Notifications and Load it from Database
         * Else
         *     Provide a Message to User, Notificiations cannot be Synchronized as App is Offline
         */
        function onDoRefresh() {
            if ($scope.stopNavigation){
                return;
            }

            $scope.stopNavigation = true;
            $timeout(function() {
                if (IsOnline()) {
                    Synchronizer.SyncNotifications()
                        .then(function() {
                            return loadNotificationFromDB()
                                .then(function() {
                                    $scope.$broadcast('scroll.refreshComplete');
                                    $scope.stopNavigation = false;
                                });
                        })
                        .catch(function(e){
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.stopNavigation = false;
                            SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.SYNC_FAIL_MESSAGE
                            });
                        });
                } else {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.stopNavigation = false;
                    SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.SYNC_NOTIF_OFF_MESSAGE
                    });

                }
            }, 500);
        }

        /**
         * Handle delete requests
         * @param  {Notification} n Notification to be deleted
         */
        function onDelete(n, index) {
            if ($scope.stopNavigation){
                return;
            }

            var deleteConfirmPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELET_NOTIF_MESSAGE

            }).then(function(res) {
                if (res) {
                    PostService.DeleteNotification(n).then(function(updatedNotifications) {
                        // $scope.notifications = updatedNotifications;
                        $scope.notifications.splice(index, 1);
                        $ionicListDelegate.closeOptionButtons();
                    });
                }
            });
        }
        /**
         * Handles delete all notifications requests
         */
        function onDeleteAll() {
            /* $ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.DELETE_NOTIF_TITLE,
                template: $rootScope.Messages.DELTE_NOTIFICATIONS,
            })*/
            var deleteAllPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELTE_NOTIFICATIONS

            }).then(function(res) {
                if (res) {
                    PostService.DeleteAllNotification().then(function() {
                        $scope.notifications = [];
                    });
                }
            });
        }
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            $scope.displayMessage = false;
            $scope.notifications = [];
            $scope.moredata = false;
            loadNotificationFromDB();
            $scope.doRefresh = onDoRefresh;
            $scope.delete = onDelete;
            $scope.deleteAll = onDeleteAll;
            $rootScope.$on('notificationupdated', loadNotificationFromDB);
        }
        onInit();
    }
    /**
     * Define dependency of AssignedSurveyCtrl
     * @type {Array}
     */
    NotificationsCtrl.$inject = ['$scope', '$rootScope',
        '$ionicListDelegate', '$ionicPopup', '$timeout', '$window', '$filter',
        'Synchronizer', 'PostService', 'UserResourceDB', 'SecuredPopups'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('NotificationsCtrl', NotificationsCtrl);
}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AssignedSurveyCtrl($scope, $rootScope, $ionicPopup, $timeout, $window,
        Synchronizer, PostService, SurveyDB, SecuredPopups) {

        function IsOnline() {
            if ($window.cordova) {
                return ($window.navigator.connection.type !== $window.Connection.NONE);
            } else {
                return $window.navigator.onLine;
            }
        }

        /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if ($scope.stopNavigation){
                event.preventDefault();
            }
        }

        /**
         * Load Surveys from Database
         */
        function loadSurveyFromDB() {
            SurveyDB.getSummary($rootScope.user.userId)
                .then(function(data) {
                    $scope.surveys = data.map(function(item) {
                        return {
                            surveyId: item.surveyId,
                            checklist: item.checklist,
                            location: item.location,
                            dueDate: item.dueDate,
                            dueDateDisplay: moment(item.dueDate).format('MM/DD/YYYY'),
                            _status: item._status
                        };
                    });

                    $scope.displayMessage = true;
                });
        }

        /**
         * Event Handler for Refresh Events
         * If User is Online
         *     Synchronizes Survey and Load it from Database
         * Else
         *     Provide a Message to User, Survey cannot be Synchronized as App is Offline
         */
        function onDoRefresh() {
            if ($scope.stopNavigation){
                return;
            }
            
            $scope.stopNavigation = true;
            $timeout(function() {
                if (IsOnline()) {
                    Synchronizer.SyncUserResources()
                        .then(loadSurveyFromDB)
                        .then(function() {
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.stopNavigation = false;
                        })
                        .catch(function(e) {
                            $scope.$broadcast('scroll.refreshComplete');
                            $scope.stopNavigation = false;
                            SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.SYNC_FAIL_MESSAGE
                            });
                        });
                } else {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.stopNavigation = false;
                    SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.SYNC_SURVEY_OFF_MESSAGE
                    });
                }
            }, 500);
        }

        /**
         * Filter Function for filtering Surveys
         */
        function _searchFilter(row) {
            var searchText = ($scope.query.search || '').toLowerCase();
            return ((row.checklist && (row.checklist.toLowerCase().indexOf(searchText) !== -1)) ||
                    (row.location && (row.location.toLowerCase().indexOf(searchText) !== -1)) ||
                    (row.dueDate && (row.dueDate.toString().toLowerCase().indexOf(searchText) !== -1))) &&
                ((row._status === $scope.query.status || row._status === "Draft") || !($scope.query.status));
        }
 
        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            /**
             * Initiatilze data
             */
            $scope.query = {
                status: "Open"
            };

            $scope.status = [{
                id: 'Open',
                name: 'Open',
                css: 'open_color'
            }, {
                id: 'Draft',
                name: 'Draft',
                css: 'draft_color'
            }];

            loadSurveyFromDB();

            /**
             * Initilaize Event Handlers and Public Functions to be used in View
             */
            $rootScope.$on("Synchronized", loadSurveyFromDB);
            $scope.$on('$stateChangeStart', onStateChangeStart);
            $scope.doRefresh = onDoRefresh;
            $scope.searchFilterFunction = _searchFilter;
        }

        onInit();

    }

    /**
     * Define dependency of AssignedSurveyCtrl
     * @type {Array}
     */
    AssignedSurveyCtrl.$inject = ['$scope', '$rootScope', '$ionicPopup', '$timeout', '$window',
        'Synchronizer', 'PostService', 'SurveyDB', 'SecuredPopups'
    ];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('AssignedSurveyCtrl', AssignedSurveyCtrl);
}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QuickIssueCtrl($scope, $rootScope, $state, $location, $q, $timeout,
        $cordovaCamera, $cordovaFile, $ionicActionSheet, $ionicPopup, $ionicModal, $ionicScrollDelegate, $window,
        PostService, OrgResourceDB, categories, locations, SecuredPopups, Analytics) {

        /**
         * Since we have used variables in this class the need to be defined at function level
         */
        var noImage = "images/no-picture.gif";
        $scope.maxImageCount = 3;
        $scope.quickIssue = {
            categoryID: null,
            locationID: null,
            source: '',
            resolved: false,
            description: '',
            actionPlan: ''
        };
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
            focused.focus();
            }
 
         }

        /**
         * Initialize _categoryId and _locationId to capture initial values - as they can not
         * always undefined or 0 if user has navigated to Survey screen
         */
        var _categoryID = $scope.quickIssue.categoryID = $rootScope.qicategoryId || 0;
        var _locationID = $scope.quickIssue.locationID = $rootScope.qiLocationId || 0;

        /**
         * On Synchronization load Category and Location again from database
         */
        function onSynechronized() {
            $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'category'),
                OrgResourceDB.getByType($rootScope.user.orgId, 'location')
            ]).then(function(data) {
                $scope.categories = JSON.parse(data[0].resource);
                $scope.locations = JSON.parse(data[1].resource);
            });
        }

        $rootScope.$on('$stateChangeSuccess',
            function(event, toState, toParams, fromState, fromParams) {
                if (toState.name === 'app.quickIssue'){
                    _locationID = $scope.quickIssue.locationID = $rootScope.qiLocationId || 0;
                    $scope.locations = angular.copy($scope.locations);
                }
            });

        /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Quick Issue Screen
         * If user has changed selection, he needs to be asked if he still willing to navigate
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if ($scope.isModified && toState.name !== "login" && !$scope.disableCheck) {
                event.preventDefault();
                /*$ionicPopup.confirm({ //Creating Confirmatio box
                    title: $rootScope.Messages.NAV_CONFIRM_TITLE,
                    template: $rootScope.Messages.NAV_CONFIRM_MESSAGE
                })*/
                var navConfirmPopup = SecuredPopups.show('confirm', {
                    title: $rootScope.Messages.MESSAGE_TITLE,
                    template: $rootScope.Messages.NAV_CONFIRM_MESSAGE

                }).then(function(res) {
                    if (res) {
                        _clearForm();
                        //$scope.disableCheck = true;
                        $scope.isModified = false;
                        $state.transitionTo(toState.name, toParams);
                    }
                });
            }
        }

        /**
         * Function to register Modals to be used from AppController.
         * Namely - AutoLogoutModal - when user is idle for 'X' minutes. Where 'X' is hardcode currently to 30 mins
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/imageZoom.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.imageZoom = modal;
            });
        }

        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.imageZoom.remove();
        }

        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        function onDestroy() {
            _unRegisterModals();
        }

        /**
         * Event Handler to display Action Sheet when user clicks on Camera Icon
         * @param  {number} id Indicating which Camera Icon was clicked
         */
        function onShowActionSheet(id) {
            if (!(id >= 0 && id < $scope.maxImageCount)) {
                return;
            }

            var takePhoto = '<i class="icon ion-camera"></i> Take Photo',
                choosePhoto = '<i class="icon ion-camera"></i> Choose Photo',
                cameraOnly = [{
                    text: takePhoto
                }],
                cameraNGallery = [{
                    text: takePhoto
                }, {
                    text: choosePhoto
                }],
                selectedOptions = $rootScope.selectedOrg.gallery === 0 ? cameraOnly : cameraNGallery;

            $ionicActionSheet.show({
                buttons: selectedOptions,
                titleText: 'Take an action',
                cancelText: 'Cancel',
                buttonClicked: function(index) {
                    $timeout(function() {
                        _addImages(id, index);
                    }, 100);
                    return true;
                }
            });
        }

        /**
         * Method to invoke Camera or Selection of Image from Gallery and attaching it to Issue
         * @param {number} id    Indicating which Camera icon was clicked
         * @param {number} index Indicating if Camera or Gallery functionality needs to be invoked.
         */
        function _addImages(id, index) {
            var destinationType = ($rootScope.selectedOrg.gallery == 1 && index == 2) ||
                ($rootScope.selectedOrg.gallery == 2) ? Camera.DestinationType.FILE_URI : Camera.DestinationType.DATA_URL;

            var options = {
                quality: 60,
                destinationType: destinationType,
                sourceType: (index === 0 ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY),
                //allowEdit: true,
                targetHeight: 1000,
                encodingType: Camera.EncodingType.JPEG,
                correctOrientation: true,
                saveToPhotoAlbum: ($rootScope.selectedOrg.gallery == 2)
            };


            try {
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    OnImageCapture(imageData, id, index, destinationType);
                });
            } catch (e) {
                var data = {
                    type: 'angular',
                    url: window.location.hash,
                    localtime: Date.now(),
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                };
                Analytics.trackException(JSON.stringify(data), false);
            }
        }

        function OnImageCapture(imageData, id, index, destinationType) {
            try {
                if (destinationType == Camera.DestinationType.FILE_URI) {
                    $cordovaFile.readAsDataURL(cordova.file.tempDirectory, imageNameFromPath(imageData))
                        .then(function(success) {
                            attachImageData(id, index, success, true);
                        }, function(error) {
                            ////console.log("error = ", error);
                        });

                } else {
                    attachImageData(id, index, imageData, false);
                }
            } catch (e) {
                var data = {
                    type: 'angular',
                    url: window.location.hash,
                    localtime: Date.now(),
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                };
                Analytics.trackException(JSON.stringify(data), false);
            }
        }

        function imageNameFromPath(imagePath) {
            return imagePath.substr(imagePath.lastIndexOf('/') + 1);
        }

        function attachImageData(id, index, imageData, isDataURL) {
            $scope.quickIssue['imgData' + id] = isDataURL ? imageData.substr(23) : imageData;
            $scope.quickIssue['imgURI' + id] = isDataURL ? imageData : "data:image/jpeg;base64," + imageData;
            $scope.quickIssue['showImage' + id] = true;
        }

        /**
         * Event Handler for Remove Image trigger
         * @param  {number} id Indicates which image to be removed
         */
        function onRemoveImages(id) {
            /*$ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.DELETE_ATTACH_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE
            })*/

            var deleteAttachPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE

            }).then(function(res) {
                if (res) {
                    if (!(id >= 0 && id < $scope.maxImageCount))
                        return;
                    $scope.quickIssue['imgData' + id] = null;
                    $scope.quickIssue['imgURI' + id] = noImage;
                    $scope.quickIssue['showImage' + id] = false;
                }
            });
        }

        /**
         * Event Handler - View Image - When user clicks on Image, Image needs to be Zoomed
         * @param  {number} id Indicates which Image was been clicked on
         */
        function onViewImage(id) {
            $scope.zoomImageSrc = $scope.quickIssue['imgURI' + id];
            $scope.imageZoom.show();
        }

        /**
         * Save Event Handler - Saves Quick Issue
         * @param  {Form} form Used for Validation of UI Controls
         */
        function onSave(form) {
            $scope.showRequired = true;
            if ($scope.quickIssue.categoryID && $scope.quickIssue.locationID && $scope.quickIssue.description) {
                PostService.SaveQuickIssue($scope.quickIssue)
                    .then(function() {
                        SecuredPopups.show('alert', {
                            title: $rootScope.Messages.MESSAGE_TITLE,
                            template: $rootScope.Messages.ISSUE_SAVED
                        });
                    }).then(_clearForm)
                    .then(function() {
                        _categoryID = $scope.quickIssue.categoryID = $rootScope.qicategoryId || 0;
                        _locationID = $scope.quickIssue.locationID = $rootScope.qiLocationId || 0;
                        $scope.isModified = false;
                        $ionicScrollDelegate.scrollTop(true);
                    })
                    .catch(function(e) {

                    });
            } else {
                SecuredPopups.show('alert', {
                    title: $rootScope.Messages.MESSAGE_TITLE,
                    template: $rootScope.Messages.REQ_FIELDS_MESSAGE

                });
            }
        }

        /**
         * Event Handler - for Cancel button. If user confirms as yes, invoke clear form functionality
         */
        function onCancel() {
            /* $ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.CANCEL_TITLE,
                template: $rootScope.Messages.CANCEL_MESSAGE
            })*/

            var CancelPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.CANCEL_MESSAGE

            }).then(function(res) {
                if (res) {
                    _clearForm();
                }
            });
        }

        /**
         * Clears the form. Category and Location are not cleared by this function as they need to be preserved
         */
        function _clearForm() {
            $scope.quickIssue = {
                categoryID: $scope.quickIssue.categoryID,
                locationID: $scope.quickIssue.locationID,
                source: '',
                resolved: false,
                description: '',
                actionPlan: ''
            };
            $scope.showRequired = false;
            for (var i = $scope.maxImageCount - 1; i >= 0; i--) {
                $scope.quickIssue['imgData' + i] = null;
                $scope.quickIssue['imgURI' + i] = noImage;
                $scope.quickIssue['showImage' + i] = false;
            }
        }

        /**
         * Event Handler for Category Change Event
         * Whenever Category is changed, it needs to be remember for remaining session
         */
        function onCategoryChange(newValue) {
            $rootScope.qicategoryId = newValue;
        }

        /**
         * Event Handler for Location Change Event
         * Whenever Location is changed, it needs to be remember for remaining session
         */
        function onLocationChange(newValue) {
            $rootScope.qiLocationId = newValue;
        }

        /**
         * Event Handler for Logout
         */
        function onLogout() {
            $scope.quickIssue = {};
            delete $rootScope.qicategoryId;
            delete $rootScope.qiLocationId;
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            _clearForm();
            $scope.isModified = false;
            $scope.categories = categories;
            $scope.locations = locations;
            $scope.attachmentremove = "Do you want to remove the attachment?";

            $scope.$watch("quickIssue.categoryID + quickIssue.locationID + quickIssue.showImage0 + quickIssue.showImage1 + quickIssue.showImage2 + quickIssue.source + quickIssue.description + quickIssue.resolved + quickIssue.actionPlan", function(newValue) {
                $scope.isModified = (newValue !== (_categoryID + _locationID + false + false + false + '' + '' + false + ''));
            });

            _registerModals();
            $rootScope.$on('logout', onLogout);
            $scope.$watch("quickIssue.categoryID", onCategoryChange);
            $scope.$watch("quickIssue.locationID", onLocationChange);
            $scope.$on('Synchronized', onSynechronized);
            $scope.$on('$stateChangeStart', onStateChangeStart);
            $scope.$on('$destroy', onDestroy);
            $scope.showAS = onShowActionSheet;
            $scope.removeImages = onRemoveImages;
            $scope.viewImages = onViewImage;
            $scope.save = onSave;
            $scope.cancel = onCancel;
            
        }

        onInit();
    }

    /**
     * Define dependency of QuickIssueCtrl
     * @type {Array}
     */
    QuickIssueCtrl.$inject = ['$scope', '$rootScope', '$state', '$location', '$q', '$timeout',
        '$cordovaCamera', '$cordovaFile', '$ionicActionSheet', '$ionicPopup', '$ionicModal', '$ionicScrollDelegate','$window',
        'PostService', 'OrgResourceDB', 'categories', 'locations', 'SecuredPopups', 'Analytics'
    ];

    /**
     * Register QuickIssueCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('QuickIssueCtrl', QuickIssueCtrl);

}());
(function() {
        // "use strict";
        // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

        function QuickSurveyCtrl($scope, $rootScope, $location,
            $ionicPopup, $q,
            PostService, OrgResourceDB, checklists, locations, questionMap,SecuredPopups	) {

            /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if (fromState.name === "app.quickSurvey") {
                onClear();
            }
        }
            /**
             * On Synchronization load Checklist and Location again from database
             */
            function onSynechronized() {
                $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'checklist'),
                    OrgResourceDB.getByType($rootScope.user.orgId, 'location')
                ]).then(function(data) {
                    $scope.checklists = JSON.parse(data[0].resource);
                    $scope.locations = JSON.parse(data[1].resource);
                });
            }

            /**
             * Clears the selection of Location and Checklist Dropdown controls
             */
            function onClear() {
                $scope.survey.locationID = null;
                $scope.survey.checklistID = null;
                $scope.survey.checklistLabel = 'Select Checklist';
                $scope.survey.locationLabel = 'Select Location';
                $scope.showRequired = false;
            }

            /**
             * Event Handler for Start Button Click
             * Creates a Survey Object and Populates it with required questions
             */
            function onStart(form) {
                $scope.showRequired = true;
                if ($scope.survey.checklistID && $scope.survey.locationID) {
                    var dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 7);

                    var survey = $rootScope.__survey = {
                        checklistID: $scope.survey.checklistID,
                        checklist: $scope.survey.checklistLabel,
                        locationID: $scope.survey.locationID,
                        location: $scope.survey.locationLabel,
                        dueDate: dueDate,
                        status: 'L',
                        isCreatedOnDevice: true,
                        questionIDs: getQuestionIds($scope.survey.checklistID),
                        Questions: getQuestionIds($scope.survey.checklistID).map(function(item) {
                                var q = questionMap[item.questionID];
                                q.order = parseInt(item.displayOrder);
                                q.answers = [];
                                return q;
                            })
                        };

                        return PostService.CreateSurvey(survey)
                            .then(function(id) {
                                onClear();
                                form.$setUntouched();
                                $scope.disableCheck = true;
                                $location.path('/app/survey/' + id);
                            });

                    } else {
                        /*return $ionicPopup.alert({
                            scope: $scope,
                            title: $rootScope.Messages.REQ_FIELDS_TITLE,
                            template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                        });*/
                        var navConfirmPopup = SecuredPopups.show('alert', {
                                                                 title: $rootScope.Messages.MESSAGE_TITLE,
                                                                 template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                                          
                                                                 });
                            return navConfirmPopup;
                    }
                }

                /**
                 * Returns questionIds associated with selected Checklist
                 * @param  {int} checklistId Id of the Checklist selected by user
                 * @return {Array}             Array of QuestionIds associated with given checklist
                 */
                function getQuestionIds(checklistId) {
                    for (var i = $scope.checklists.length - 1; i >= 0; i--) {
                        if ($scope.checklists[i].id === checklistId) {
                            return $scope.checklists[i].questionIDs;
                        }
                    }
                }

                /**
                 * Event Handler to execute Initialization Logic
                 */
                function onInit() {
                    $scope.survey = {
                        checklistLabel: 'Select Checklist',
                        locationLabel: 'Select Location'
                    };
                    $scope.checklists = checklists;
                    $scope.locations = locations;
                    $scope.showRequired = false;
                    $scope.$on('Synchronized', onSynechronized);
                    $scope.clear = onClear;
                    $scope.start = onStart;
                    $scope.$on('$stateChangeStart', onStateChangeStart);
                }

                onInit();
            }

            /**
             * Define dependency of QuickSurveyCtrl
             * @type {Array}
             */
            QuickSurveyCtrl.$inject = ['$scope', '$rootScope', '$location',
                '$ionicPopup', '$q',
                'PostService', 'OrgResourceDB', 'checklists', 'locations', 'questionMap','SecuredPopups'
            ];

            /**
             * Register QuickSurveyCtrl with healthApp.controllers Module
             */
            angular.module('healthApp.controllers').controller('QuickSurveyCtrl', QuickSurveyCtrl);

        }());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SurveyCtrl($scope, $rootScope, $stateParams, $state, $q, $timeout, $filter,
        $ionicModal, $ionicActionSheet, $cordovaCamera, $ionicPopup, $ionicLoading, $ionicScrollDelegate,
        UserResourceDB, OrgResourceDB, SurveyDB, AttachmentDB, Analytics,$window,
        apiService, queryService, PostService, $cordovaFile, $location, SecuredPopups) {

        var noImage = "images/no-picture.jpg";
        var reqFieldsAlert = null;
        var debounceBroadCastScroll = ionic.debounce(onBroadCastScroll, 50); 
        function onBroadCastScroll(){
            $scope.$broadcast('survey-scrolling', null);
        }

        $scope.broadcastScroll = function(){
           debounceBroadCastScroll();
        };
 
    /*
    * This code to reload keyboard on orientation change in ios devices.
    */
    if($rootScope.iphone4Orientation == 'true'){
    $window.addEventListener('orientationchange', reloadKeyboardOnly, false);
    }
    function reloadKeyboardOnly(){
    //alert("Orientation changed");
   if($rootScope.isVisible){
    var focused = document.activeElement;
    document.activeElement.blur();
    focused.focus();
   }
 
    }

        /**
         * Checks if Current Answer fails Validation
         * @return {[type]} [description]
         */
        function doesCurrentAnswerFailsValidation(returnPromise, openQuestion) {

            var q = $scope.currentQuestion;
            if (q && q.currentAnswer) {
                //If current answer is dummy - and option is not selected - invalid - only do not save.
                //If current answer is dummy - and option is selected as NC and description is not provided - invalid, do not save - do not allow to loose focus
                if (q.currentAnswer.compliant === "NC" && !q.currentAnswer.freeText) {
                    q.currentAnswer.isValidated = true;
                    if (!reqFieldsAlert) {
                        reqFieldsAlert = SecuredPopups.show('alert', {
                            title: $rootScope.Messages.MESSAGE_TITLE,
                            template: $rootScope.Messages.REQ_FIELDS_MESSAGE
                        });
                        reqFieldsAlert.then(function() {
                            reqFieldsAlert = null;
                        });
                    }
             $timeout(function() {
                if ($ionicScrollDelegate.$getByHandle('survey-scroll')) {
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTo(0, (q.topPosition || 0), true);
                }
               
          }, 50);
                    return true;
                }

                q.currentAnswer.isModified = JSON.stringify(angular.copy(q.currentAnswer)) !== q.__ca;
                if (q.currentAnswer.isModified && q.currentAnswer.compliant) {

                    var promise = saveAnswer(q, q.currentAnswer);
                    if (returnPromise) {
                        return promise;
                    }
                }
                if (!openQuestion) {
                    q.currentAnswer.isCurrent = false;
                    q.currentAnswer.isEditable = false;
                }

            }
            return false;
        }

        function onJobTypeById(id){
            var item = $scope.jobTypes.filter(function(i){ 
                return i.id === id;
            });
            if (item.length === 1){
                return item[0].name;
            }
        }

        /**
         * Handles On State Change Event
         * This event is triggered when user tries to navigate from Survey Screen
         * If current Questions, current Answer is in-valid, user needs to stay on this page, and correct the error
         */
        function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
            if (toState.name !== "login" && !$scope.disableCheck) {
                event.preventDefault();
                if (doesCurrentAnswerFailsValidation(false, true)) {
                    return;
                }

                if (toState.name === "app.quickIssue" && $scope.currentQuestion) {
                    var surveyState = {};
                    surveyState.currentQuestionId = $scope.currentQuestion.id;
                    surveyState.currentScroll = $ionicScrollDelegate.$getByHandle('survey-scroll').getScrollPosition();
                    $rootScope.surveyState = surveyState;
                } else {
                    $rootScope.surveyState = null;
                }


                // if ($scope.currentQuestion) {
                //     $scope.currentQuestion.isCurrent = false;
                //     $scope.currentQuestion = null;
                // }


                // Note: Disabling the Confirmation box as per jira ticket MP-358
                //$ionicPopup.confirm({     
                //    title: 'Confirmation',
                //    template: 'Do you want to navigate to another page?'
                //}).then(function(res) {
                //    if (res) {
                $scope.disableCheck = true;
                $state.transitionTo(toState.name, toParams);
                //    }
                //});
            }
        }

        
        /**
         * Function to register Modals to be used from AppController.
         * Namely - defaultAnswerModal - when user clicks on Complete, this view is shown to him to get default answer
         *         - AdditionalInfo - when user clicks on '...' additional infor modal window is shown
         *         - imageZoom - when user clicks on any image, image is expanded
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/defaultAnswer.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.defaultAnswerModal = modal;
            });

            $ionicModal.fromTemplateUrl('templates/additionalinfo.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.additionalInfo = modal;
            });

            $ionicModal.fromTemplateUrl('templates/imageZoom.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.imageZoom = modal;
            });
        }

        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.defaultAnswerModal.remove();
            if ($scope.additionalInfo) {
                $scope.additionalInfo.remove();
            }
            $scope.imageZoom.remove();
        }

        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        function onDestroy() {
            _unRegisterModals();
            queryService.removeQuery('cannot-logout');
        }

        /**
         * Utility function to provide count of answer for given type of compliance
         */
        function countOfAnswerByType(type, answers) {
            var count = 0;
            for (var i = answers.length - 1; i >= 0; i--) {
                if (answers[i].compliant === type) {
                    count++;
                }
            }
            return count;
        }



        /**
         * Event Handler to display Action Sheet when user clicks on Camera Icon
         * @param  {number} id Indicating which Camera Icon was clicked
         * @param  {Answer} answer Answer object to which image needs to be attached
         */
        function onShowActionSheet(answer, id) {
            if (!(id >= 0 && id < $scope.maxImageCount))
                return;

            $scope.freezeQuestion = true;

            var takePhoto = '<i class="icon ion-camera"></i> Take Photo',
                choosePhoto = '<i class="icon ion-camera"></i> Choose Photo',
                cameraOnly = [{
                    text: takePhoto
                }],
                cameraNGallery = [{
                    text: takePhoto
                }, {
                    text: choosePhoto
                }],
                selectedOptions = $rootScope.selectedOrg.gallery === 0 ? cameraOnly : cameraNGallery;
            //($rootScope.selectedOrg.gallery === 1 ? cameraNGallery : cameraNGallerWithMoveTo);

            $ionicActionSheet.show({
                buttons: selectedOptions,
                titleText: 'Take an action',
                cancelText: 'Cancel',
                buttonClicked: function(index) {
                    $timeout(function() {
                        _addImages(answer, id, index);
                    }, 100);
                    return true;
                },
                cancel: function() {
                    $scope.freezeQuestion = false;
                }
            });

        }

        /**
         * Method to invoke Camera or Selection of Image from Gallery and attaching it to Issue
         * @param {Answer} answer Answer to which Image needs to be attached
         * @param {number} id    Indicating which Camera icon was clicked
         * @param {number} index Indicating if Camera or Gallery functionality needs to be invoked.
         */
        function _addImages(answer, id, index) {
            var destinationType = ($rootScope.selectedOrg.gallery == 1 && index == 2) ||
                ($rootScope.selectedOrg.gallery == 2) ? Camera.DestinationType.FILE_URI : Camera.DestinationType.DATA_URL;

            //destinationType = Camera.DestinationType.DATA_URL;
            var options = {
                quality: 60,
                destinationType: destinationType,
                sourceType: index === 0 ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY,
                //allowEdit: true,
                targetHeight: 1000,
                encodingType: Camera.EncodingType.JPEG,
                correctOrientation: true,
                saveToPhotoAlbum: ($rootScope.selectedOrg.gallery == 2)
            };

            $cordovaCamera.getPicture(options)
                .then(function(imageData) {
                    OnImageCaptur(imageData, id, index, destinationType, answer);
                }).catch(function(e) {
                    var data = {
                        type: 'angular',
                        url: window.location.hash,
                        localtime: Date.now(),
                        message: e.message,
                        name: e.name,
                        stack: e.stack
                    };
                    Analytics.trackException(JSON.stringify(data), false);
                    $scope.freezeQuestion = false;
                });
        }

        function OnImageCaptur(imageData, id, index, destinationType, answer) {
            try {
                if (destinationType == Camera.DestinationType.FILE_URI) {
                    $cordovaFile.readAsDataURL(cordova.file.tempDirectory, imageNameFromPath(imageData))
                        .then(function(success) {
                            attachImageData(answer, id, index, success, true);
                        }, function(error) {
                            //console.log("error = ", error);
                        });

                } else {
                    attachImageData(answer, id, index, imageData, false);
                }

            } catch (e) {
                var data = {
                    type: 'angular',
                    url: window.location.hash,
                    localtime: Date.now(),
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                };
                Analytics.trackException(JSON.stringify(data), false);
            }
        }

        function imageNameFromPath(imagePath) {
            var name = imagePath.substr(imagePath.lastIndexOf('/') + 1);
            return name;

        }

        function attachImageData(answer, id, index, imageData, isDataURL) {
            answer.issue.images = answer.issue.images || function() {};

            if (answer.issue.images["imageId" + id]) {

                var srcArr = answer.issue.issueAttachment;
                var destArr = [];
                srcArr.forEach(function(imageid){
                    if (imageid !== answer.issue.images["imageId" + id]){
                        destArr.push(imageid);
                    }
                });
                answer.issue.issueAttachment = destArr;
                answer.issue.images.deleteImages = answer.issue.images.deleteImages || [];
                answer.issue.images.deleteImages.push(answer.issue.images["imageId" + id]);
            }

            answer.issue.images['imgData' + id] = isDataURL ? imageData.substr(23) : imageData;
            answer.issue.images['imgURI' + id] = isDataURL ? imageData : "data:image/jpeg;base64," + imageData;

            answer.issue.images['showImage' + id] = true;

            delete answer.issue.images["imageId" + id];
            delete answer.issue.images["imageFN" + id];
            $scope.freezeQuestion = false;
        }

        /**
         * Event Handler for Remove Image trigger
         * @param {Answer} answer Answer from which Image needs to be removed
         * @param  {number} id Indicates which image to be removed
         */
        function onRemoveImages(answer, id) {
            if (!(id >= 0 && id < $scope.maxImageCount))
                return;

            /*$ionicPopup.confirm({ //Creating Confirmatio box
                title: $rootScope.Messages.DELETE_ATTACH_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE
            })*/
            var deleteAttachedPopup = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELETE_ATTACH_MESSAGE

            }).then(function(res) {
                if (res) {

                    if (answer.issue.images["imageId" + id]) {
                        answer.issue.images.deleteImages = answer.issue.images.deleteImages || [];
                        answer.issue.images.deleteImages.push(answer.issue.images["imageId" + id]);
                    }
                    answer.issue.images['imgData' + id] = null;
                    answer.issue.images['imgURI' + id] = noImage;
                    answer.issue.images['showImage' + id] = false;
                    delete answer.issue.images["imageId" + id];
                    delete answer.issue.images["imageFN" + id];
                }
            });
        }

        /**
         * Event Handler - View Image - When user clicks on Image, Image needs to be Zoomed
         * @param {Answer} answer Answer from which Image needs to be Viewed
         * @param  {number} id Indicates which Image was been clicked on
         */
        function onViewImages(answer, id) {
            $scope.zoomImageSrc = answer.issue.images['imgURI' + id];
            $scope.imageZoom.show();
            if (answer.issue.images["imageId" + id]) {
                AttachmentDB.getBigPictureById(answer.issue.images["imageId" + id])
                    .then(function(data) {
                        $scope.zoomImageSrc = "data:image/" + data.ext + ";base64," + data.bigData;
                    });
            }
        }

        /**
         * Event Handler for Search text Change
         * If Search text has changed and current questions, current answer is invalid state,
         * search text should be reverted to empty string, and user should be asked to fix the
         * answer
         */
        function onSearchTextChanged() {
            if (doesCurrentAnswerFailsValidation()) {
                $scope.query.search = '';
            } else {
                $scope.query.__search = $scope.query.search || '';
                var searchText = $scope.query.__search.toLowerCase();
                var isOdd = true;
                var iCount = 0;
                if ($scope.survey && $scope.survey.Questions){
                    $scope.survey.Questions.forEach(function(row){
                        row.hide = !(((row.name && row.name.toLowerCase().indexOf(searchText) !== -1) || (row.category && row.category.toLowerCase().indexOf(searchText) !== -1)));
                        if (!row.hide){
                            row.isOdd = isOdd;
                            isOdd = !isOdd;
                            iCount++;
                        }
                    });
                }
                $scope.visibleRecords = iCount;
                $scope.__filteredQuestions = [];
                $scope.__filteredQuestionsLength = 0;
                copyPageOfQuestions();
                $timeout(function(){
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTop();
                         },100);
            }
        }


        // /**
        //  * Search Filter to search Questions
        //  */
        // function searchFilter(row) {
        //     var searchText = ($scope.query.__search || '').toLowerCase();
        //     return ((row.name && row.name.toLowerCase().indexOf(searchText) !== -1) || (row.category && row.category.toLowerCase().indexOf(searchText) !== -1));
        // }

        /**
         * Utility function returns a new blank answer
         */
        function newAnswer(defaultActionPlan) {
            var images = function() {};
            images.imgURI0 = noImage;
            images.showImage0 = false;
            images.imgURI1 = noImage;
            images.showImage1 = false;
            images.imgURI2 = noImage;
            images.showImage2 = false;

            return {
                id: PostService.getId(),
                freeText: '',
                isDummy: true,
                issue: {
                    id: PostService.getId(),
                    resolved: "N",
                    images: images,
                    issueAttachment: [],
                    actionPlan: defaultActionPlan || ""
                }
            };
        }

        /**
         * Event Handler for OnClick of Question
         * If Current Question, has current Answer which is invalid, prompt user and exit algorithm
         */
        function onQuestionSelected(question) {
            if ($scope.freezeQuestion)
                return;

            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!question.isCurrent) {
                if ($scope.currentQuestion){
                    $scope.currentQuestion._answers = [];
                }
                question._answers = question.answers;
                question.showAnswers = false;

                if ($scope.currentQuestion && $scope.currentQuestion.isCurrent) {
                    $scope.currentQuestion.isCurrent = false;
                    if ($scope.currentQuestion.currentAnswer) {
                        $scope.currentQuestion.currentAnswer.isCurrent = false;
                        $scope.currentQuestion.currentAnswer = null;
                    }
                    $scope.currentQuestion = null;
                }

                $scope.currentQuestion = question;
                question.isCurrent = true;

                var deviceInfo = Analytics.getDeviceInformation();
 
                //alert('true' + deviceInfo.version);
 
                if(deviceInfo.platform == "iOS"){
 
                    $timeout(function(){
                    $scope.$apply(function(){
                        $scope.movingUpwards = true;
                    });
                },500);
                }

                if (question.answers.length === 0 || (question.answers.length > 0 && !question.answers[0].isDummy)) {
                    var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
                } else {
                    question.answers.forEach(function(a) {
                        a.isCurrent = false;
                        a.isEditable = false;
                    });
                }

                var answer = question.answers[0];
                answer.isCurrent = true;
                question.currentAnswer = answer;
                question.__ca = JSON.stringify(angular.copy(answer));

            } else {
                if ($scope.currentQuestion && $scope.currentQuestion.isCurrent) {
                    $scope.currentQuestion.isCurrent = false;
                    if ($scope.currentQuestion.currentAnswer) {
                        $scope.currentQuestion.currentAnswer.isCurrent = false;
                        $scope.currentQuestion.currentAnswer = null;
                    }
                    $scope.currentQuestion = null;
                }
            }
        }

        function onMakeAnswerEditable(question, answer) {
            if (doesCurrentAnswerFailsValidation(false, true)) {
                return;
            }
            
            if (!question.answers[0].isDummy){
                var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
            }

            question.answers.forEach(function(a) {
                a.isEditable = false;
                a.isCurrent = false;
            });

            question.currentAnswer = answer;
            answer.isCurrent = true;
            answer.isEditable = true;
            question.__ca = JSON.stringify(answer);
        }

        function onShowHideAnswers(question) {
            // if (doesCurrentAnswerFailsValidation()) {
            //     return;
            // }

            question.showAnswers = !question.showAnswers;
        }

        function onRevertAnswer(question, answer) {
            SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.REVRT_MESSAGE
            }).then(function(res) {
                if (res) {
                    var ans = JSON.parse(question.__ca);
                    UpdateAnswer(ans, $scope.imagemap);
                    for (var prop in answer) {
                        answer[prop] = ans[prop];
                    }
                    answer.isEditable = false; //MP-530
                }
            });
        }

        /**
         * Event Handler to add new answer
         */
        function onAddAnswer(question) {

            var isDummy = question.currentAnswer.isDummy;

            if (question.currentAnswer.isDummy && !question.currentAnswer.compliant) {
                return;
            }

            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!isDummy){
                question.currentAnswer.isEditable = false;
                return;
            }

            if (question.answers[0].isDummy && !question.answers[0].compliant) {
                question.answers[0].isCurrent = true;
                question.currentAnswer = question.answers[0];
                question.__ca = JSON.stringify(angular.copy(question.answers[0]));
                return;
            }
            
            var answers = question.answers;
            question._answers = question.answers = [];
            question.answers.push(newAnswer(question.defaultActionPlan));
            for (var i = 0; i <= answers.length - 1; i++) {
                answers[i].isCurrent = false;
                question.answers.push(answers[i]);
            }

            var answer = question.answers[0];
            answer.isCurrent = true;
            question.currentAnswer = answer;
            question.__ca = JSON.stringify(angular.copy(answer));
        }

        function onDeleteAnswer(question, answer) {
            
            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            if (!question.answers[0].isDummy){
                var ans = question.answers;
                    question._answers = question.answers = [];
                    question.answers.push(newAnswer(question.defaultActionPlan));
                    for (var i = 0; i <= ans.length - 1; i++) {
                        ans[i].isCurrent = false;
                        ans[i].isEditable = false;
                        question.answers.push(ans[i]);
                    }
            }

            var index = question.answers.findIndex(function(e, i, a) {
                return e.id === answer.id;
            });

            SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.DELETE_ANSWER

            }).then(function(res) {
                if (res) {
                    if (index > -1) {
                        question.answers.splice(index, 1);
                        question._answers = question.answers;
                    }
                    PostService.DeleteAnswer(answer.id)
                        .then(function() {
                            return PostService.UpdateSurveyInMemory($scope.survey);
                        }).then(function() {
                            if (question.answers.length === 0) {
                                question.answers.push(newAnswer(question.defaultActionPlan));
                            }
                            var ans = question.answers[0];
                            ans.isCurrent = true;
                            question.currentAnswer = ans;
                            question.__ca = JSON.stringify(angular.copy(ans));
                        });
                }
            });
        }

        function onSelectAnswer(q, a) {
            if (!a.isCurrent) {
                if (doesCurrentAnswerFailsValidation()) {
                    return;
                }
                q.currentAnswer = a;
                a.isCurrent = true;
                q.__ca = JSON.stringify(angular.copy(a));
            }
        }

        function onSaveAsDraft() {
            if (doesCurrentAnswerFailsValidation()) {
                return;
            }

            PostService.SaveSurveyWithStatus($scope.survey)
                .then(function() {
                    return PostService.UpdateSurveyInMemory($scope.survey);
                }).then(function() {
                    /*$ionicPopup.alert({
                        title: $rootScope.Messages.DRAFT_TITLE,
                        template: $rootScope.Messages.DRAFT_MESSAGE
                    })*/
                    var msgDraftPopup = SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.DRAFT_MESSAGE

                    }).then(function(res) {
                        $rootScope.$broadcast("surveyupdated");
                        $scope.disableCheck = true;
                        $state.transitionTo('app.assignedSurvey');
                    });
                });
        }

        function onSaveAsComplete() {
            var promise = doesCurrentAnswerFailsValidation(true);
            if (!angular.isObject(promise)) {
                if (promise) {
                    return;
                }
            }


            var surveyHasUnAnsweredQuestion = false;
            $scope.survey.Questions.forEach(function(q) {
                if ((q.answers.length === 0) || (q.answers.length === 1 && q.answers[0].isDummy)) {
                    surveyHasUnAnsweredQuestion = true;
                }
            });

            if (surveyHasUnAnsweredQuestion) {
                $scope.defaultAnswerModal.show();
            } else {
                if (angular.isObject(promise)) {
                    promise.then(function() {
                        PostService.UpdateSurvey($scope.survey)
                            .then(function() {
                                /*$ionicPopup.alert({
                                    title: $rootScope.Messages.COMPLETE_TITLE,
                                    template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                                })*/
                                var msgCompletePopup = SecuredPopups.show('alert', {
                                    title: $rootScope.Messages.MESSAGE_TITLE,
                                    template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                                }).then(function(res) {
                                    $rootScope.$broadcast("surveyupdated");
                                    $scope.disableCheck = true;
                                    $state.transitionTo('app.assignedSurvey');
                                });
                            });
                    });
                } else {
                    PostService.UpdateSurvey($scope.survey)
                        .then(function() {
                            /*$ionicPopup.alert({
                                title: $rootScope.Messages.COMPLETE_TITLE,
                                template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                            })*/
                            var msgCompleteElsePopup = SecuredPopups.show('alert', {
                                title: $rootScope.Messages.MESSAGE_TITLE,
                                template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                            }).then(function(res) {
                                $rootScope.$broadcast("surveyupdated");
                                $scope.disableCheck = true;
                                $state.transitionTo('app.assignedSurvey');
                            });
                        });
                }
            }
        }

        function onUpdateAnswer(answer, compliant) {
            if (answer.compliant && !answer.isDummy) {
                /* $ionicPopup.alert({
                    title: $rootScope.Messages.ANS_LOCKED_TITLE,
                    template: $rootScope.Messages.ANS_LOCKED_MESSAGE
                });*/
                var ansLockedPopup = SecuredPopups.show('alert', {
                    title: $rootScope.Messages.MESSAGE_TITLE,
                    template: $rootScope.Messages.ANS_LOCKED_MESSAGE
                });
            } else {
                answer.compliant = compliant;
                if (answer.compliant === "NC") {
                    answer.issue = answer.issue || {
                        resolved: 'N'
                    };
                }
            }
        }

        function Level1Object(item) {
            var data = {
                name: item.name,
                externalDisplayID: item.externalDisplayID,
                treeName: item.treeName,
                subItems: []
            };

            for (var key in item) {
                if (!(key === "name" || key === "treeName" || key === "externalDisplayID")) {
                    data.subItems.push(Level2Object(item[key]));
                }
            }

            return data;
        }

        function Level2Object(item) {
            var data = {
                name: item.name,
                externalDisplayID: item.externalDisplayID,
                subItems: []
            };

            for (var key in item) {
                if (!(key === "name" || key === "externalDisplayID")) {
                    data.subItems.push(item[key]);
                }
            }

            return data;
        }


        function onPopulateAdditionalInfo(question) {
            $scope.additionalInfoData = [];
            if ($rootScope.isOnline && $scope.selectedOrg.isSubscribed) {
                apiService.getMoreInfo($rootScope.user.sessionId, question.id)
                    .success(function(data) {
                        if (data.status.success === "true") {

                            var info = [];
                            angular.forEach(data.response, function(r) {
                                info.push(Level1Object(r));
                            });

                            $scope.additionalInfoData = info;
                            $scope.isOffline = true;
                        }
                    })
                    .error(function(data) {});
            }

            if (!$rootScope.isOnline) {
                $scope.isOffline = false;
                $scope.linkedStnd = $rootScope.Messages.WIFI_LINKED_STND_MESSAGE;
            }
        }

        function onShowAdditionalInfo(question) {
            $scope.additionalInfoQuestion = question;
            $scope.populateAdditionalInfo(question);
            $ionicScrollDelegate.$getByHandle('addInfo-scroll').scrollTo(0, 0, false);
            $scope.additionalInfo.show();
        }

        function onCloseAdditionalInfo() {
            $ionicScrollDelegate.$getByHandle('addInfo-scroll').scrollTo(0, 0, false);
            $scope.additionalInfo.hide();
        }

        function onSelectDefaultAnswer(answerOption) {
            $scope.defaultAnswerModal.hide();
            $scope.survey.defaultAnswer = answerOption;
            return PostService.UpdateSurvey($scope.survey)
                .then(function() {
                    /* var alertPopup = $ionicPopup.alert({
                        title: $rootScope.Messages.COMPLETE_TITLE,
                        template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                    });
                    alertPopup*/
                    var CompleteMsgPopup = SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.SURVEY_COMPLETED_MESSAGE
                    }).then(function(res) {
                        $rootScope.$broadcast("surveyupdated");
                        $scope.disableCheck = true;
                        $state.transitionTo('app.assignedSurvey');
                    });
                });


        }

        function saveAnswer(q, a) {
            if (a.isDummy && !a.compliant) {
                return;
            }

            delete a.isDummy;

            a.updated = moment(new Date()).format('MM/DD/YYYY'); //new Date();

            return PostService.SaveAnswer(a, q, $scope.survey)
                .then(function() {
                    if ($scope.survey.status != 'T') {
                        $scope.survey.status = 'T';
                        return PostService.SaveSurveyWithStatus($scope.survey);
                    }
                }).then(function() {
                    return PostService.UpdateSurveyInMemory($scope.survey);
                }).then(function() {

                    for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                        if (a.issue.images['imgURI' + i] !== noImage &&
                            a.issue.images['imageId' + i] && a.issue.images['_imgData' + i]) {
                            var image = {
                                ext: '.jpeg',
                                data: a.issue.images['_imgData' + i],
                                attachmentId: a.issue.images['imageId' + i]
                            };
                            $scope.imagemap[image.attachmentId] = image;
                        }
                    }
                });
        }

        /**
         * Populates Survey Object with Image Attachments and Funcitons to return count of question based on type
         */
        function populateSurveyWithImagesAndFuncitons(map) {
            $scope.survey.Questions.forEach(function(q) {
                q.compliant = function() {
                    return countOfAnswerByType('C', this.answers);
                };
                q.noncompliant = function() {
                    return countOfAnswerByType('NC', this.answers);
                };
                q.notApplicable = function() {
                    return countOfAnswerByType('NA', this.answers);
                };
                q.isCurrent = false;

                q.answers.forEach(function(a) {
                    return UpdateAnswer(a, map);
                });
            });
            $scope.displayMessage = true;

            if ($rootScope.surveyState) {
                var index = $scope.survey.Questions.findIndex(function(e) {
                    return e.id === $rootScope.surveyState.currentQuestionId;
                });
                if (index > -1) {
                    onQuestionSelected($scope.survey.Questions[index]);
                }
                var currentPosition = $rootScope.surveyState.currentScroll;
                $ionicScrollDelegate.$getByHandle('survey-scroll').scrollTo(currentPosition.left, currentPosition.top);
                delete $rootScope.surveyState;
            }
        }

        function UpdateAnswer(a, map) {
            a.issue.images = function() {};
            a.issue.issueAttachment = a.issue.issueAttachment || [];
            var i = 0;
            a.issue.issueAttachment.forEach(function(id) {
                if (map[id]) {
                    a.issue.images['imgData' + i] = null;
                    a.issue.images['imgURI' + i] = "data:image/" + map[id].ext + ";base64," + map[id].data;
                    a.issue.images['showImage' + i] = true;
                    a.issue.images['imageId' + i] = map[id].attachmentId;
                    i++;
                }
            });
            if (i < 3) {
                for (var y = i; y < 3; y++) {
                    a.issue.images['imgData' + y] = null;
                    a.issue.images['imgURI' + y] = noImage;
                    a.issue.images['showImage' + y] = false;
                    delete a.issue.images["imageId" + y];
                    delete a.issue.images["imageFN" + y];
                }
            }
        } 

        function copyPageOfQuestions() {
            var counter = 0;
            //var index = $scope.__filteredQuestionsLength;
 
                $scope.__Questions = $scope.__Questions || [];

            while (counter < 30 && $scope.__filteredQuestionsLength < $scope.__Questions.length){
                var question = $scope.__Questions[$scope.__filteredQuestionsLength];
                if (!question.hide){
                    $scope.__filteredQuestions[$scope.__filteredQuestions.length] = question;
                    counter++;
                }
                $scope.__filteredQuestionsLength++;
            }
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }

        function onHideTopBar(){
            // if ($ionicScrollDelegate.$getByHandle('survey-scroll')) {
            //     $ionicScrollDelegate.$getByHandle('survey-scroll').scrollBy(0, -600, false);
            // }
            // 
            $ionicScrollDelegate.freezeScroll(true);
            $scope.movingUpwards = !$scope.movingUpwards;
            console.log("Moving Upward " + $scope.movingUpwards + " - from controller");
            $timeout(function(){
                $ionicScrollDelegate.freezeScroll(false);
            }, 50);
            
            // $timeout(function(){
            //     $scope.$apply(function(){
            //         $scope.movingUpwards = true;
            //     });
            // },50);
            
        }

        function onInit() {
            $scope.displayMessage = false;
            $scope.maxImageCount = 3;
            $scope.query = {};
            $scope.currentQuestion = null;
            $scope.currentAnswer = null;
            $scope.isOffline = true;
            $scope.selectedOrg = $rootScope.selectedOrg;
            $scope.loadMoreData = copyPageOfQuestions;
            $scope.hideTopBar = onHideTopBar;

            _registerModals();

            queryService.setQuery('cannot-logout', doesCurrentAnswerFailsValidation);
            $scope.$watch('query.search', onSearchTextChanged);
            $scope.$on('$destroy', onDestroy);
            $scope.$on('$stateChangeStart', onStateChangeStart);

            //$scope.searchFilterFunction = searchFilter;
            $scope.showAS = onShowActionSheet;
            $scope.removeImages = onRemoveImages;
            $scope.viewImages = onViewImages;
            $scope.selectQuestion = onQuestionSelected;
            $scope.addAnswer = onAddAnswer;
            $scope.deleteAnswer = onDeleteAnswer;
            $scope.selectAnswer = onSelectAnswer;
            $scope.saveAsDraft = onSaveAsDraft;
            $scope.saveAsComplete = onSaveAsComplete;
            $scope.updateAnswer = onUpdateAnswer;
            $scope.populateAdditionalInfo = onPopulateAdditionalInfo;
            $scope.showAdditionalInfo = onShowAdditionalInfo;
            $scope.closeAddiitonalInfo = onCloseAdditionalInfo;
            $scope.selectDefaultAnswer = onSelectDefaultAnswer;
            $scope.makeAnswerEditable = onMakeAnswerEditable;
            $scope.revertAnswer = onRevertAnswer;
            $scope.showHideAnswers = onShowHideAnswers;
            $scope.jobTypeById = onJobTypeById;
            $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING;

            if ($rootScope.__survey) {
                $scope.survey = $rootScope.__survey;
                $scope.visibleRecords = $scope.survey.Questions.length;
                $scope.survey.Questions = $filter('orderBy')($scope.survey.Questions, 'order');
                $scope.__Questions = $scope.survey.Questions.map(function(item, index){ 
                    var isOdd = index % 2;
                    item.isOdd = isOdd;
                    item.hide = false;
                    return item; 
                });
                $scope.__filteredQuestions = [];
                $scope.__filteredQuestionsLength = 0;
                copyPageOfQuestions();

                if ($scope.survey.Questions && $scope.survey.Questions.length > 180){
                    $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING_TOO_LONG;
                }
                $rootScope.qiLocationId = $scope.survey.locationID;
                $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'jobtype'),
                    AttachmentDB.getBySurveyId($stateParams.surveyId)
                ]).then(function(data) {
                    $scope.jobTypes = JSON.parse(data[0].resource);
                    var map = {};
                    data[1].forEach(function(item) {
                        map[item.attachmentId] = item;
                    });
                    return map;
                }).then(function(map) {
                    $scope.imagemap = map;
                    populateSurveyWithImagesAndFuncitons(map);
                });
                delete $rootScope.__survey;
            } else {
                SurveyDB.getById($rootScope.user.userId, $stateParams.surveyId)
                    .then(function(data) {
                        $scope.survey = JSON.parse(data.json);
                        $scope.visibleRecords = $scope.survey.Questions.length;
                        $scope.survey.Questions = $filter('orderBy')($scope.survey.Questions, 'order');
                        $scope.__Questions = $scope.survey.Questions.map(function(item, index){ 
                            var isOdd =  (index % 2) || false;
                            item.isOdd = isOdd;
                            item.hide = false;
                            return item; 
                        });
                        $scope.__filteredQuestions = [];
                        $scope.__filteredQuestionsLength = 0;
                        copyPageOfQuestions();

                        if ($scope.survey.Questions && $scope.survey.Questions.length > 180){
                            $scope.loadingMessage = $rootScope.Messages.SURVEY_LOADING_TOO_LONG;
                        }

                        $rootScope.qiLocationId = $scope.survey.locationID;
                    }).then(function() {
                        return $q.all([OrgResourceDB.getByType($rootScope.user.orgId, 'jobtype'),
                            AttachmentDB.getBySurveyId($stateParams.surveyId)
                        ]);
                    }).then(function(data) {
                        $scope.jobTypes = JSON.parse(data[0].resource);
                        var map = {};
                        data[1].forEach(function(item) {
                            map[item.attachmentId] = item;
                        });
                        return map;
                    }).then(function(map) {
                        $scope.imagemap = map;
                        populateSurveyWithImagesAndFuncitons(map);
                    }).catch(function(e){
                        console.log(e);
                    });
            }
        }

        onInit();
    }

    SurveyCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$state', '$q', '$timeout', '$filter',
        '$ionicModal', '$ionicActionSheet', '$cordovaCamera', '$ionicPopup', '$ionicLoading', '$ionicScrollDelegate',
        'UserResourceDB', 'OrgResourceDB', 'SurveyDB', 'AttachmentDB', 'Analytics','$window',
        'apiService', 'queryService', 'PostService', '$cordovaFile', '$location', 'SecuredPopups'
    ];

    angular.module('healthApp.controllers').controller('SurveyCtrl', SurveyCtrl);
}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function introCtrl($scope, $rootScope, $state,
        $ionicSlideBoxDelegate, $ionicPlatform, $ionicModal, $timeout, $interval,
        UserResourceDB, $ionicPopup, SecuredPopups, Analytics) {


        //var confirmSkip;
        var confirmRepeat;

        /**
         * Function to register Modals to be used from AppController.
         * Namely - AutoLogoutModal - when user is idle for 'X' minutes. Where 'X' is hardcode currently to 30 mins
         * @return {void}
         */
        function _registerModals() {
            $ionicModal.fromTemplateUrl('templates/autoLogout.html', {
                scope: $scope,
                animation: 'slide-in'
            }).then(function(modal) {
                $scope.autoLogoutModal = modal;
            });
        }
        /**
         * Function to destroy Modals created when controller was initiatlized
         * @return {void}
         */
        function _unRegisterModals() {
            $scope.autoLogoutModal.remove();
        }
        
        /**
         * Handler to reduce Count-down, once started
         * Apart from reducing Count-down, it also checks if Count-down has been completed
         * if Yes, it logouts user and redirects him/her to Login Screen
         * It Also, checks if there was any User Activity, and it needs to shut down the counter
         * and close Auto-Logout Modal View
         */
        var timerArray = [];

        function tick() {
            if ($rootScope.UserActivityTimeout) { //Check if there was User Activity,
                $scope.logoutCounter--; //Decrement the counter - it will be reflected on screen
                if ($scope.logoutCounter > 0) { //Check if Logout out counter has been completed
                    timerArray.push($timeout(tick, 1000));
                } else {
                    if ($rootScope.user && $rootScope.user.userId) {
                        /**
                         * Log Google Analytics Event for Auto-Logout
                         */
                        if (!$state.is('login')) {
                            Analytics.trackEvent({
                                category: "Authentication",
                                action: "Auto Logout",
                                label: "userid",
                                value: $rootScope.user.userId
                            });

                            if (confirmRepeat){
                                $scope.abondanRepeat = true;
                                confirmRepeat.close(true);
                            }

                            // if (confirmSkip){
                            //     confirmSkip.close(true);
                            // }

                            $rootScope.$broadcast('logout'); //Lgout
                            $state.transitionTo('login'); //Redirect user to Login Screen
                        }
                    }
                }
            } else {
                $scope.autoLogoutClose(); //Since there was user Activity - shut down counter and close Auto-Logout View
            }
        }
        /**
         * Event Handler for Destroy Event
         * @return {void}
         */
        var cleanUserIdleHandler;

        function onDestroy() {
            _unRegisterModals();
            cleanUserIdleHandler();
        }
        
        /**
         * Event handler to be execute when user is idle
         * @param  {number} diff Provides number of minutes user has been Idle additional to upper limit set.
         * This number if greater than 1, user has idle and application was minimized, hence application was
         * not able to trigger this event
         * In case diff is not greater than 1, then it indicates application is active, show user count-down modal
         */
        function onUserIdle(event, diff) {
            timerArray.map(function(timerPromise) {
                $timeout.cancel(timerPromise);
            });
            /**
             * Log Google Analytics Event for Logout
             */
            Analytics.trackEvent({
                category: "Authentication",
                action: "User Idle",
                label: "userid",
                value: $rootScope.user.userId
            });
            if (diff.value >= 0) {
                /**
                 * Log Google Analytics Event for Logout - When application was in Background and Activated
                 */
                if (!$state.is('login')) {
                    Analytics.trackEvent({
                        category: "Authentication",
                        action: "Auto Logout - Background",
                        label: "userid",
                        value: $rootScope.user.userId
                    });
                    onAutoLogoutClose();

                    if (confirmRepeat){
                        $scope.abondanRepeat = true;
                        confirmRepeat.close(true);
                    }

                    // if (confirmSkip){
                    //     confirmSkip.close(true);
                    // }

                    $rootScope.$broadcast('logout'); //Logout
                    $state.transitionTo('login'); //Redirect user to Login Screen
                }
            } else {
                if (diff.value < 0 && diff.value >= -1) {
                    if (diff.resumedFromBg !== true) {
                        $scope.logoutCounter = 60;
                    } else {
                        $scope.logoutCounter = Math.round(Math.abs(diff.value) * 60);
                    }

                    timerArray.push($timeout(tick, 1000)); //Handler to reduce Countdown on every second
                    
                    if (confirmRepeat){
                        $scope.abondanRepeat = true;
                        confirmRepeat.close(true);
                    }

                    // if (confirmSkip){
                    //     confirmSkip.close(true);
                    // }
                    
                    //NOTE: if confirmSkip is on, $timeout is required for this invocation
                    $timeout(function(){ 
                      $scope.autoLogoutModal.show(); //Show countdown Modal View to User
                    },50);
                }
            }
        }
        /**
         * Event Handler to close Auto-Logout Countdown Window. Used by Auto-Logout Modal Popup
         * @return {[type]} [description]
         */
        function onAutoLogoutClose() {
            $timeout(function(){
                $scope.autoLogoutModal.hide();
            }, 50);
        }

        $scope.leftButton = "Skip Intro";
        $scope.rightButton = "Next";


        /**
         * Event Handler to handle navigating between Intro Screen to Login Screen
         * Before navigating - update an entry in AppResource table to remember - user has seen Intro pages
         */
        function onStartApp() {
            var confirmRepeat = SecuredPopups.show('confirm', {
                title: $rootScope.Messages.MESSAGE_TITLE,
                template: $rootScope.Messages.INTRO_SCREEN_MESSAGE,
                cancelText: 'No',
                okText: 'Yes'

            });

            confirmRepeat.then(function(result) {
                if (!$scope.abondanRepeat) {
                    if (!result) {
                        var data = {
                            userId: $rootScope.user.userId,
                            resourceType: "appAccessed",
                            resource: true,
                            timeStamp: new Date(),
                        };
                        UserResourceDB.AddOrUpdate(data);
                    }
    
                    $state.go('app.quickAction');
                    confirmRepeat = null;
                }
            });

        }

        function onLogout(){
            $rootScope.$broadcast('logout'); //Logout
            $state.transitionTo('login'); //Redirect user to Login Screen
        }
        /**
         * Event Handler for Next button click
         */
        function onNext() {
            $ionicSlideBoxDelegate.next();
        }

        /**
         * Event Handler for Previous button click
         */
        function onPrevious() {
            $ionicSlideBoxDelegate.previous();
        }

        function onLeftButtonClick() {
            if ($scope.leftButton === "Skip Intro") {
                onStartApp();
            } else {
                onPrevious();
            }
        }

        function onRightButtonClick() {
            if ($scope.rightButton === "Next") {
                onNext();
            } else {
                onStartApp();
            }
        }

        function onSlideIndexChanged(newValue) {
            if (newValue > 0) {
                $scope.leftButton = "Previous";
            }

            if (newValue === 0) {
                $scope.leftButton = "Skip Intro";
            }

            if (newValue == 8) {
                $scope.rightButton = "Start App";
            }

            if (newValue < 8) {
                $scope.rightButton = "Next";
            }
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            if (!$rootScope.user) {
                $state.transitionTo('login');
                return;
            }

            _registerModals();
            /**
             * Event Handlers and Functions attached to $scope to be used in View
             */
            $scope.$on('$destroy', onDestroy);
            cleanUserIdleHandler = $rootScope.$on('UserIdle', onUserIdle);
            $scope.autoLogoutClose = onAutoLogoutClose;

            $scope.next = onNext;
            $scope.previous = onPrevious;
            $scope.startApp = onStartApp;
            $scope.leftButtonClick = onLeftButtonClick;
            $scope.rightButtonClick = onRightButtonClick;
            $scope.slideIndex = 0;
            $scope.$watch("slideIndex", onSlideIndexChanged);
            $scope.logout = onLogout;
            $ionicSlideBoxDelegate.slide(0, 1);
            // //Note: Do not change this instance to SecuredPopups. 
            // //It requires to be ionicPopup as it needs to be closed in code
            // confirmSkip = $ionicPopup.confirm({
            //     title: 'Message',
            //     template: $rootScope.Messages.INTRO_SCREEN_INFO_MESSAGE,
            //     cancelText: 'Skip',
            //     okText: 'View'
            // });

            // confirmSkip.then(function(result) {
            //     if (!result) {
            //         $state.go('app.quickAction');
            //     }
            //     confirmSkip = null;
            // });
        }

        onInit();
    }

    /**
     * Define dependency of introCtrl
     * @type {Array}
     */
    introCtrl.$inject = ['$scope', '$rootScope', '$state',
        '$ionicSlideBoxDelegate', '$ionicPlatform', '$ionicModal', '$timeout', '$interval',
        'UserResourceDB', '$ionicPopup', 'SecuredPopups', 'Analytics'
    ];
    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('introCtrl', introCtrl);
}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SynchronizeCtrl($scope, $rootScope, $state, $stateParams, $q, UserResourceDB, QueueDB, Synchronizer, SecuredPopups, AppResourceDB) {

        /**
         * Select Initial Data Loading Message based on if user is logging in for first time or second time
         */
        function _selectInitiatDataLoadingMessage(userId) {
            var deferred = $q.defer();
            if ($scope.isLogin) {
                UserResourceDB.getByType($rootScope.user.userId, 'notification')
                    .then(function(data) {
                        $scope.isLoading = true;
                        $scope.loadingMessage = data ? $rootScope.Messages.SUBSEQ_LOADING_MESSAGE : $rootScope.Messages.INITIAL_LOADING_MESSAGE;
                    }).then(deferred.resolve);
            } else {
                $scope.loadingMessage = $rootScope.Messages.SYNC_LOADING_MESSAGE;
                deferred.resolve(true);
            }
            return deferred.promise;
        }

        function _clean() {
            var deferred = $q.defer();
            if (!$scope.isLogin) {
                Synchronizer.CleanDb()
                    .then(deferred.resolve)
                    .catch(deferred.reject);
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        }

        function _synchronize() {
            QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) {
                        return Synchronizer.SyncQueue();
                    }
                }).then(function() {
                    if ($rootScope.SyncError) {
                        return SecuredPopups.show('alert', {
                            title: $rootScope.Messages.MESSAGE_TITLE,
                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR
                        }).then(function() {
                            $state.transitionTo('login');
                        });
                    } else {
                        return _clean().then(Synchronizer.SyncOrgResources)
                            .then(Synchronizer.SyncUserResources)
                            .then(function() {
                                if ($scope.isLogin) {
                                    return Synchronizer.InitializeBackgroundSynchronizer();
                                }
                            }).then(function() {
                                if ($scope.isLogin) {
                                    return UserResourceDB.getByType($rootScope.user.userId, "appAccessed")
                                            .then(function(data) {
                                                if (data) {
                                                    $state.transitionTo('app.quickAction');
                                                } else {
                                                    $state.transitionTo('intro');
                                                }
                                            });
                                } else {
                                    $state.transitionTo('app.quickAction');
                                    return null;
                                }
                            }).then(function() {
                                return AppResourceDB.getByType("lastUser").then(function(data) {
                                    data = data || {};
                                    data.resourceType = "lastUser";
                                    data.resource = $rootScope.user.name;
                                    data.timeStamp = new Date();
                                    return AppResourceDB.AddOrUpdate(data);
                                });
                            });
                    }
                })
                .catch(function(e) {
                    SecuredPopups.show('alert', {
                        title: $rootScope.Messages.MESSAGE_TITLE,
                        template: $rootScope.Messages.RELOGIN_MESSAGE 
                    }).then(function() {
                        $state.transitionTo('login');
                    });
                });
        }

        /**
         * Event Handler to execute Initialization Logic
         */
        function onInit() {
            $scope.loadingMessage = "";
            $scope.isLogin = $stateParams.isLogin === 'true';
            _selectInitiatDataLoadingMessage($rootScope.user.userId)
                .then(_synchronize);
        }

        onInit();
    }

    /**
     * Define dependency of AppCtrl
     * @type {Array}
     */
    SynchronizeCtrl.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$q',
        'UserResourceDB', 'QueueDB', 'Synchronizer', 'SecuredPopups', 'AppResourceDB'
    ];

    /**
     * Register AppCtrl with healthApp.controllers Module
     */
    angular.module('healthApp.controllers').controller('SynchronizeCtrl', SynchronizeCtrl);

}());
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
        .directive('input', ['$timeout', function($timeout) {
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
        }])
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
(function () {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    angular.module('healthApp.services', ['ionic', 'healthApp.config', 'ngCordova'])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.headers.post = {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        };
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }]);

}());
(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    function DB($q, DB_CONFIG, $window,$rootScope) {

        var db;

        function init() {
            db = $window.cordova ?sqlitePlugin.openDatabase({
                name: DB_CONFIG.name,
                location: 2,
                key: $rootScope.encrypted
            }) :sqlitePlugin.openDatabase({name: "DB_CONFIG.name", key: $rootScope.encrypted}); //$window.openDatabase(DB_CONFIG.name, '1.0', "database", -1);

            return $q.all(
                DB_CONFIG.tables.map(function(table) {
                    var columns = table.columns.map(function(column) {
                        return column.name + ' ' + column.type;
                    });
                    var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
                    return execute(query);
                })
            );
        }

        function execute(query, bindings) {
            bindings = typeof bindings !== 'undefined' ? bindings : [];
            var deferred = $q.defer();
            db.transaction(function(tx) {
                tx.executeSql(query, bindings, function(tx, result) {
                        deferred.resolve(result);
                    },
                    function(transaction, error) {
                        deferred.reject(error);
                    });
            });
            return deferred.promise;
        }

        function fetchAll(query, bindings) {
            return execute(query, bindings)
                .then(function(result) {
                    var output = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        output.push(result.rows.item(i));
                    }
                    return output;
                });
        }

        function fetchOne(query, bindings) {
            return execute(query, bindings)
                .then(function(result) {
                    return result.rows.length > 0 ? result.rows.item(0) : null;
                });
        }

        return {
            init: init,
            query: execute,
            fetchAll: fetchAll,
            fetchOne: fetchOne
        };
    }

    DB.$inject = ['$q', 'DB_CONFIG', '$window','$rootScope'];
    angular.module('healthApp.services').factory('DB', DB);

}());
(function () {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AttachmentDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYSURVEYID": "SELECT attachmentId, ext, data FROM Attachment WHERE surveyId = ?;",
                "DELETEBYID": "DELETE FROM Attachment WHERE attachmentId = ?;",
                "DELETEBYSURVEYID": "DELETE FROM Attachment WHERE surveyId = ?;",
                "DELETEBBYORGID": "DELETE FROM Attachment WHERE orgId = ?",
                "INSERT": "INSERT INTO Attachment (attachmentId, ext, data, bigData, surveyId, orgId) VALUES (?, ?, ?, ?, ?, ?);",
                "SELECTBIGPICTUREBYID": "SELECT bigData, ext FROM Attachment WHERE attachmentId = ?;"
            };

        self.getBySurveyId = function(surveyId) {
            return DB.fetchAll(QUERIES.SELECTBYSURVEYID, [surveyId]);
        };

        self.getBigPictureById = function(attachmentId){
            return DB.fetchOne(QUERIES.SELECTBIGPICTUREBYID, [attachmentId]);
        };

        self.deleteByOrgId = function(orgId) {
            return DB.query(QUERIES.DELETEBBYORGID, [orgId]);
        };

        self.deleteById = function(attachmentId) {
            return DB.query(QUERIES.DELETEBYID, [attachmentId]);
        };

        self.deleteBySurveyId = function(surveyId) {
            return DB.query(QUERIES.DELETEBYSURVEYID, [surveyId]);
        };

        self.add = function(data) {
            return DB.query(QUERIES.INSERT, [data.attachmentId, data.ext, data.data, data.bigData, data.surveyId, data.orgId]);
        };

        return self;
    }

    AttachmentDB.$inject = ['DB'];

    angular.module('healthApp.services').factory('AttachmentDB', AttachmentDB);
}());

    
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


(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function ActivityMonitor($rootScope, $window, $interval, $state) {
        var eventsToMonitor = 'mousemove keydown wheel DOMMouseScroll mousewheel mousedown touchstart touchmove MSPointerDown MSPointerMove';
        var lastActivity = new Date();
        var idleTimeAllowed = 30; //minutes
        //var idleTimeAllowed = 3; //minutes put for testing

        function OnEvent(e) {
            lastActivity = new Date();
            $rootScope.UserActivityTimeout = false;
        }

        function attachEventHandler() {
            eventsToMonitor.split(' ')
                .forEach(function(event) {
                    $window.addEventListener(event, OnEvent);
                });
        }

        function checkUserIdleTime(resumedFromBg) {
            var now = new Date();
            var diffMin = (now - lastActivity) / 60000;
            if ($rootScope.user && $rootScope.user.userId) {
                if (diffMin - idleTimeAllowed >= -1) {
                    $rootScope.UserActivityTimeout = true;
                    $rootScope.$broadcast('UserIdle', {
                        value: diffMin - idleTimeAllowed,
                        resumedFromBg: resumedFromBg
                    });
                }
            }
        }

        function resume() {
            if ($state.is('synchronize')){
                $state.transitionTo('login');
                return;
            }

            checkUserIdleTime(true);
        }

        function initiatlize() {
            $interval(checkUserIdleTime, 60000, 0, false);
            $window.addEventListener("resume", resume, false);
            lastActivity = new Date();
            attachEventHandler();
        }

        return {
            init: initiatlize
        };
    }

    ActivityMonitor.$inject = ['$rootScope', '$window', '$interval', '$state'];
    angular.module('healthApp.services').factory('ActivityMonitor', ActivityMonitor);

}());
(function () {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function Analytics ($window, GA_CODE, $cordovaDevice) {

            function startTracker() {
                try {
                    if ($window.analytics) {
                        $window.analytics.startTrackerWithId(GA_CODE); 
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }
            }

            function captureDeviceInfo() {
                try {
                    var device = $cordovaDevice.getDevice();
                    addCustomData({
                        key: 'Cordova',
                        value: device.cordova
                    });
                    addCustomData({
                        key: 'Model',
                        value: device.model
                    });
                    addCustomData({
                        key: 'Name',
                        value: device.name
                    });
                    addCustomData({
                        key: 'Platform',
                        value: device.platform
                    });
                    addCustomData({
                        key: 'UUID',
                        value: device.uuid
                    });
                    addCustomData({
                        key: 'Version',
                        value: device.version
                    });
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }
            }

            function setUserId(userId) {
                try {
                    if (userId && $window.analytics) {
                        $window.analytics.setUserId(userId);
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }

            }

            function trackView(view) {
                try {
                    if (view && $window.analytics) {
                        $window.analytics.trackView(view);
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }

            }

            function addCustomData(data) {
                try {
                    if (data && data.key && data.value && $window.analytics) {
                        $window.analytics.addCustomDimension(data.key, data.value);
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }

            }

            function trackEvent(data) {
                try {
                    if (data && data.category && data.action && data.label && $window.analytics) {
                        $window.analytics.trackEvent(data.category, data.action, data.label, data.value || 0);
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }

            }

            function trackException(description, fatal) {
                console.log("Error", description);
                try {
                    if (description && $window.analytics) {
                        $window.analytics.trackException(description, fatal);
                    }
                } catch (e) {
                    console.log(e);
                }
            }

            function trackTiming(data) {
                try {
                    if (data && data.category && data.milliseconds && data.variable && data.label && $window.analytics) {
                        $window.analytics.trackTiming(data.category, data.milliseconds, data.variable, data.label);
                    }
                } catch (e) {
                    trackException(JSON.stringify(e), false);
                }
            }

            function initialize() {
                startTracker();
            }
 /*This function is used to get the device details*/
 function getDeviceInformation() {
 
 var deviceInfomation = {};
 
 // Check if it's web view.
 if (ionic.Platform.isWebView()) {
 // Get device information
 deviceInfomation = {
 model: $cordovaDevice.getModel(),
 version: $cordovaDevice.getVersion(),
 uuid: $cordovaDevice.getUUID(),
 deviceinfo: $cordovaDevice.getDevice(),
 platform: $cordovaDevice.getPlatform(),
 };
 }
 else {
 // for brower only. where device information is null.
 deviceInfomation = {
 model: 'browser',
 version: '9.0',
 deviceinfo: 'Machine',
 platform: 'IONIC',
 };
 }
 
 return deviceInfomation;
 }

            return {
                init: initialize,
                setUserId: setUserId,
                trackView: trackView,
                addCustomData: addCustomData,
                trackEvent: trackEvent,
                trackException: trackException,
                trackTiming: trackTiming,
                captureDeviceInfo: captureDeviceInfo,
                getDeviceInformation : getDeviceInformation
            };
        }

        Analytics.$inject =['$window', 'GA_CODE', '$cordovaDevice'];
        angular.module('healthApp.services').factory('Analytics', Analytics);

}());


(function() {
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function Timer(Analytics) {

        var timings = {};


        function startTimer(category, variable, label) {
            timings[category + variable + label] = {
                start: new Date()
            };
        }

        function endTimer(category, variable, label) {
            var t = timings[category + variable + label];
            if (t) {
                Analytics.trackTiming({
                    category: category,
                    variable: variable,
                    label: label,
                    milliseconds: new Date() - t.start
                });
            }
        }

        return {
            start: startTimer,
            end: endTimer
        };
    }

    Timer.$inject = ['Analytics'];
    angular.module('healthApp.services').factory('Timer', Timer);

}());
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function OrgResourceDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, orgId, resourceType, resource, timeStamp FROM OrgResource WHERE orgId = ? AND resourceType = ?;",
                "INSERT": "INSERT INTO OrgResource (resource, timeStamp, resourceType, orgId) VALUES (?, ?, ?, ?);",
                "DELETEALLBYORGID": "DELETE FROM OrgResource WHERE orgId = ?",
                "UPDATEBYRESOURCE": "UPDATE OrgResource SET resource = ?, timeStamp = ? WHERE resourceType = ? AND orgId = ?"
            };
        
        self.getByType = function (orgId, type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [orgId, type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType, data.orgId]);
        };
        
        self.deleteAll = function(orgId) {
            return DB.query(QUERIES.DELETEALLBYORGID, [orgId]);
        };

        return self;
    }

    OrgResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory("OrgResourceDB", OrgResourceDB);

}());




(function () {
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function AppResourceDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, resourceType, resource, timeStamp FROM AppResource WHERE resourceType = ?;",
                "INSERT": "INSERT INTO AppResource (resource, timeStamp, resourceType) VALUES (?, ?, ?);",
                "DELETEALL": "DELETE FROM AppResource",
                "UPDATEBYRESOURCE": "UPDATE AppResource SET resource = ?, timeStamp = ? WHERE resourceType = ?"
            };
        
        self.getByType = function (type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType]);
        };

        self.deleteAll = function() {
            return DB.query(QUERIES.DELETEALL);
        };

        return self;
    }

    AppResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('AppResourceDB', AppResourceDB);

}());


(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function UserResourceDB(DB) {
        var self = this,
            QUERIES = {
                "SELECTBYTYPE": "SELECT id, userId, resourceType, resource, timeStamp FROM UserResource WHERE userId = ? AND resourceType = ?;",
                "INSERT": "INSERT INTO UserResource (resource, timeStamp, resourceType, userId) VALUES (?, ?, ?, ?);",
                "DELETEBYUSERID": "DELETE FROM UserResource WHERE userId = ?",
                "DELETEBYUSERIDRESOURCETYPE": "DELETE FROM UserResource WHERE userId = ? AND resourceType = ?;",
                "UPDATEBYRESOURCE": "UPDATE UserResource SET resource = ?, timeStamp = ? WHERE resourceType = ? AND userId = ?"
            };

        self.getByType = function(userId, type) {
            return DB.fetchOne(QUERIES.SELECTBYTYPE, [userId, type]);
        };

        self.AddOrUpdate = function (data) {
            data.resource = JSON.stringify(data.resource);
            var query = data.id ? QUERIES.UPDATEBYRESOURCE : QUERIES.INSERT;
            return DB.query(query, [data.resource, data.timeStamp, data.resourceType, data.userId]);
        };

        self.deleteAll = function(userId) {
            return DB.query(QUERIES.DELETEBYUSERID, [userId]);
        };

        self.deleteByType = function(userId, type) {
            return DB.query(QUERIES.DELETEBYUSERIDRESOURCETYPE, [userId, type]);
        };

        return self;
    }

    UserResourceDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('UserResourceDB', UserResourceDB);

}());
(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QueueDB(DB, $q) {
        var self = this,
            QUERIES = {
                "SELECTTOP": "SELECT id, userId, message FROM Queue WHERE userId = (?) ORDER BY id LIMIT 1;",
                "INSERT": "INSERT INTO Queue (userId, message) VALUES (?, ?);",
                "DELETEBYID": "DELETE FROM Queue WHERE id = (?)",
                "COUNTBYUSERID": "SELECT COUNT(*) as Count FROM Queue WHERE userId = (?);"
            };

        self.getTopItem = function(userId) {
            return DB.fetchOne(QUERIES.SELECTTOP, [userId]);
        };

        self.delete = function(id) {
            return DB.query(QUERIES.DELETEBYID, [id]);
        };

        self.length = function(userId) {
            return DB.fetchOne(QUERIES.COUNTBYUSERID, [userId])
                .then(function(data) {
                    return data.Count;
                });
        };

        self.push = function(data) {
            return DB.query(QUERIES.INSERT, [data.userId, data.message]);
        };

        return self;
    }

    QueueDB.$inject = ['DB', '$q'];
    
    angular.module('healthApp.services').factory('QueueDB', QueueDB);

}());
(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function SurveyDB (DB) {
        var self = this,
            QUERIES = {
                "SELECTSUMMARY": "SELECT surveyId, checklist, location, dueDate, _status FROM Survey WHERE userId = ?;",
                "SELECTBYID": "SELECT json FROM Survey WHERE userId = ? AND surveyId = ?;",
                "INSERT": "INSERT INTO Survey (surveyId, tempId, userId, checklistID, checklist, locationID, location, dueDate, _status, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                "DELETEBYID": "DELETE FROM Survey WHERE userId = ? AND (surveyId = ? OR tempId = ?);",
                "DELETEBYUSERID": "DELETE FROM Survey WHERE userId = ?;",
                "UPDATEBYSURVEYID": "UPDATE Survey SET checklist = ?, location = ?, dueDate = ?, _status = ?, json = ? WHERE (surveyId = ? OR tempId = ?)"
            };

        self.getSummary = function(userId) {
            return DB.fetchAll(QUERIES.SELECTSUMMARY, [userId]);
        };

        self.getById = function(userId, surveyId) {
            return DB.fetchOne(QUERIES.SELECTBYID, [userId, surveyId]);
        };

        self.update = function(data) {
            return DB.query(QUERIES.UPDATEBYSURVEYID, [data.checklist, data.location, data.dueDate, data._status, data.json, data.surveyId, data.tempId]);
        };

        self.add = function(data) {
            return DB.query(QUERIES.INSERT, [data.surveyId, data.tempId, data.userId, data.checklistID, data.checklist, data.locationID, data.location, data.dueDate, data._status, data.json]);
        };

        self.deleteById = function(userId, surveyId) {
            return DB.query(QUERIES.DELETEBYID, [userId, surveyId, surveyId]);
        };

        self.deleteByUserId = function(userId) {
            return DB.query(QUERIES.DELETEBYUSERID, [userId]);
        };

        return self;
    }

    SurveyDB.$inject = ['DB'];
    
    angular.module('healthApp.services').factory('SurveyDB', SurveyDB);

}());
(function () {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function apiService (url, $http, QueueDB) {
        var self = this;

        self.__post = function(data) {
            return $http({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                transformRequest: function(obj) {
                    var str = [];
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)){
                            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                        }
                    }
                    return str.join("&");
                },
                data: data
            });
        };

        self.login = function(userid, password) {
            return self.__post({
                app: "RPHEALTH",
                request: "Login",
                username: userid,
                password: password,
                build : "1.9.6"
            });
        };

        self.switchOrganization = function(sessionId, orgId) {
            return self.__post({
                request: "SwitchOrganization",
                sessionId: sessionId,
                orgId: orgId
            });
        };

        self.retrieveData = function(sessionId, dataSource, timestamp, page) {
            return self.__post({
                request: "RetrieveData",
                sessionId: sessionId,
                datasource: dataSource,
                timestamp: timestamp,
                page : page
            });
        };

        self.getTemplates = function(sessionId, timestamp) {
            return self.__post({
                app: "RPHEALTH",
                request: "GetTemplates",
                sessionId: sessionId,
                timestamp: timestamp
            });
        };

        self.sync = function(userId, sessionId, identifier, datasource, action, object) {
            var message = {
                request: "Sync",
                sessionId: sessionId,
                identifier: identifier,
                datasource: datasource,
                action: action,
                object: object
            };

            QueueDB.push(userId, JSON.stringify(message));
        };

        self.getErrorMessage = function() {
            return self.__post({
                app: "RPHEALTH",
                request: "GetErrorMessages",
                datasource: "errormessages",
            });
        };

        self.getMoreInfo = function(sessionId, questionId) {
            return self.__post({
                request: "GetMoreInfo",
                questionID: questionId,
                sessionId: sessionId
            });
        };

        return self;
    }

    apiService.$inject = ['url', '$http', 'QueueDB'];
    angular.module('healthApp.services').factory("apiService", apiService);
}());


(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function Synchronizer($rootScope,
        QueueDB, OrgResourceDB, AppResourceDB, UserResourceDB, SurveyDB, Timer,
        apiService, $q, $timeout, $interval, AttachmentDB, $state, $ionicPopup) {
        var self = this;

        function filterForAddUpdate(items) {
            var list = [];
            items.forEach(function(item) {
                if (item.status !== "D") {
                    list.push(item);
                }
            });
            return list;
        }

        function filterForDelete(items) {
            var list = [];
            items.forEach(function(item) {
                if (item.status === "D") {
                    list.push(item);
                }
            });
            return list;
        }

        function removeFromArray(src, dest, matcher) {
            if (angular.isArray(src) && angular.isArray(dest)) {
                dest.forEach(function(item) {
                    var index = src.findIndex(function(e) {
                        return matcher(e, item);
                    });
                    if (index >= 0) {
                        src.splice(index, 1);
                    }
                });
            }
        }

        function addUpdateIntoArray(src, dest, matcher) {
            if (angular.isArray(src) && angular.isArray(dest)) {
                dest.forEach(function(item) {
                    var index = src.findIndex(function(e) {
                        return matcher(e, item);
                    });
                    if (index > 0) {
                        src[index] = item;
                    } else {
                        src.push(item);
                    }
                });
            }
        }

        var matcherBy = {
            "errormessages": function(src, dest) {
                return src.token === dest.token;
            },
            "GetTemplates": function(src, dest) {
                return src.key === dest.key;
            },
            "checklist": function(src, dest) {
                return src.id === dest.id;
            },
            "category": function(src, dest) {
                return src.id === dest.id;
            },
            "jobtype": function(src, dest) {
                return src.id === dest.id;
            },
            "location": function(src, dest) {
                return src.id === dest.id;
            },
            "question": function(src, dest) {
                return src.id === dest.id;
            },
            "notification": function(src, dest) {
                return src.id === dest.id;
            },
            "issueattachment": function(src, dest) {
                return src.id === dest.id;
            }
        };

        var mapperFor = {
            "errormessages": function(items) {
                return items.map(function(item) {
                    return {
                        token: item.token,
                        message: item.message
                    };
                });
            },
            "GetTemplates": function(items) {
                return items.map(function(item) {
                    return {
                        key: item.key,
                        value: item.value
                    };
                });
            },
            "checklist": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name,
                        questionIDs: item.questionIDs
                    };
                });
            },
            "category": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "jobtype": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "location": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                });
            },
            "question": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        isJobType: item.isJobType,
                        isUniqueID: item.isUniqueID,
                        compliantAnswer: item.compliantAnswer,
                        answerTemplate: item.answerTemplate,
                        categoryID: item.categoryID,
                        category: item.categoryName, 
                        hasStandards: item.hasStandards,
                        defaultActionPlan: item.defaultActionPlan
                    };
                });
            },
            "notification": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        message: item.message,
                        created: item.created
                    };
                });
            },
            "issueattachment": function(items) {
                return items.map(function(item) {
                    return {
                        id: item.id,
                        issueID: item.issueID,
                        filename: item.filename,
                        picture: item.picture,
                        surveyId: item.surveyID,
                        orgId: item.ownerID
                    };
                });
            }
        };

        function __synchronizeResource(dbInvoker, resourceType, apiInvoker, dbInvokerAddUpdate) {
            Timer.start('Synchronize', 'Resources', resourceType);
            return dbInvoker(resourceType)
                .then(function(data) {
                    data = data || {};
                    data.resourceType = resourceType;
                    data.resource = data.resource ? JSON.parse(data.resource) : [];
                    data.orgId = ($rootScope.user || {}).orgId;
                    data.userId = ($rootScope.user || {}).userId;

                    return apiInvoker(data.timeStamp)
                        .then(function(response) {
                            if (response && response.data && response.data.status && response.data.status.success === "true") {
                            //if (response.data.status.success === "true") {
                                data.timeStamp = response.data.status.currentTimestamp;
                                if (!data.resource) {
                                    data.resource = mapperFor[resourceType](response.data.response);
                                } else {
                                    var entriesToAddUpdate = mapperFor[resourceType](filterForAddUpdate(response.data.response));
                                    var entriesToDelete = filterForDelete(response.data.response);
                                    removeFromArray(data.resource, entriesToDelete, matcherBy[resourceType]);
                                    addUpdateIntoArray(data.resource, entriesToAddUpdate, matcherBy[resourceType]);
                                }
                                $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                                $rootScope.resourcesCount[resourceType] = data.resource.length;
                                if (resourceType === 'notification'){
                                    $rootScope.$broadcast('notificationupdated');
                                }
                                var resource = data.resource;
                                return dbInvokerAddUpdate(data).then(function() {
                                    return resource;
                                });
                            }
                        })
                        .catch(function(e) {});
                })
                .catch(function(e) {});
        }

        function getOrgChecklistMap(orgId) {
            return OrgResourceDB.getByType(orgId, "checklist").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgLocationMap(orgId) {
            return OrgResourceDB.getByType(orgId, "location").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgCategoryMap(orgId) {
            return OrgResourceDB.getByType(orgId, "category").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item.name;
                });
                return map;
            });
        }

        function getOrgQuestionMap(orgId) {
            return OrgResourceDB.getByType(orgId, "question").then(function(data) {
                var map = {};
                JSON.parse(data.resource).forEach(function(item) {
                    map[item.id] = item;
                });
                return map;
            });
        }

        self.getOrgQuestionMap = getOrgQuestionMap;

        function mergeArray(arrDest, arrSrc) {
            for (var i = arrSrc.length - 1; i >= 0; i--) {
                arrDest.push(arrSrc[i]);
            }
        }

        self.SyncSurveys = function() {
            Timer.start('Synchronize', 'Resources', 'survey');

            return self.SyncQueue()
                .then(function() {
                    if ($rootScope.SyncError) {
                        return $ionicPopup.alert({
                            title: $rootScope.Messages.QUEUE_PEND_TITLE,
                            template: $rootScope.Messages.QUEUE_PROCESSING_ERROR
                        });
                    } else {
                        return getOrgQuestionMap($rootScope.user.orgId)
                            .then(function(data) {
                                var questionData = data;
                                return SurveyDB.deleteByUserId($rootScope.user.userId)
                                    .then(function() {
                                        return _syncSurveyByPage(1, questionData);
                                    });
                            });
                    }
                });
        };

        function _syncSurveyByPage(index, questionData) {
            if (index === 0) {
                return;
            }

            return apiService.retrieveData($rootScope.user.sessionId, "survey", null, index)
                .then(function(data) {
                    var surveys = data.data.response;
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};

                    if (index === 1) {
                        $rootScope.resourcesCount.survey = surveys.length;
                    } else {
                        $rootScope.resourcesCount.survey += surveys.length;
                    }

                    return $q.all(surveys.map(function(item) {
                        var attachmentIds = [];
                        item.checklist = item.name;
                        item.location = item.locationName;
                        delete item.locationName;
                        item.Questions = item.questions.map(function(q) {
                            var question = questionData[q.questionID];
                            if (question) {
                                question.order = parseInt(q.displayOrder);
                                question.answers = q.answers.map(function(a) {
                                    if (a.compliant === "NC") {
                                        a.freeText = a.issue.description;
                                    }
                                    a.issue = a.issue || {
                                        resolved: "N"
                                    };
                                    a.issue.issueAttachment = a.issue.issueAttachment || [];
                                    mergeArray(attachmentIds, a.issue.issueAttachment || []);
                                    return a;
                                });
                                return question;
                            }
                        });
                        item.isProcessed = true;
                        //Save Survey
                        //Update Attachments
                        return SurveyDB.add({
                            surveyId: item.id,
                            userId: $rootScope.user.userId,
                            checklist: item.checklist,
                            location: item.location,
                            dueDate: item.dueDate,
                            _status: item.status === "T" ? "Draft" : "Open",
                            json: angular.toJson(item),
                            tempId: item.tempID
                        });
                    })).then(function() {
                        var status = data.data.status;
                        if (status.page < status.totalPages) {
                            return status.page + 1;
                        } else {
                            return 0;
                        }
                    });
                }).then(function(index) {
                    return _syncSurveyByPage(index, questionData);
                });
        }

        self.SyncAttachments = function() {
            Timer.start('Synchronize', 'Resources', 'issueattachment');

            return UserResourceDB.getByType($rootScope.user.userId, 'issueattachment')
                .then(function(data) {
                    data = data || {};
                    return _syncAttachmentsByPage(1, data.timeStamp, data.id);
                }).then(function() {
                    Timer.end('Synchronize', 'Resources', 'issueattachment');
                });
        };

        function _syncAttachmentsByPage(index, timeStamp, id) {
            if (index === 0) {
                return;
            }
            return apiService.retrieveData($rootScope.user.sessionId, "issueattachment", timeStamp, index)
                .then(function(response) {
                    if (index === 1) {
                        var data = {
                            timeStamp: response.data.status.currentTimestamp,
                            resourceType: 'issueattachment',
                            userId: $rootScope.user.userId,
                            id: id
                        };
                        UserResourceDB.AddOrUpdate(data);
                    }

                    return $q.all(response.data.response.map(function(attachment) {
                        if (attachment.filename !== null && attachment.status !== 'D') {
                            var fileNameReversed = attachment.filename.split('').reverse();
                            var indexOfDot = fileNameReversed.indexOf('.');
                            var ext = '';
                            if (indexOfDot > 0) {
                                ext = fileNameReversed.slice(0, indexOfDot).reverse().join('');
                            }
                            return AttachmentDB.add({
                                attachmentId: attachment.id,
                                ext: ext,
                                data: attachment.thumbnail,
                                bigData: attachment.picture,
                                surveyId: attachment.surveyID,
                                orgId: attachment.ownerID
                            }).catch(function(e) {
                                console.log(e);
                            });
                        }
                    })).then(function() {
                        var status = response.data.status;
                        if (status.page < status.totalPages) {
                            return status.page + 1;
                        } else {
                            return 0;
                        }
                    });
                }).then(function(index) {
                    return _syncAttachmentsByPage(index, timeStamp);
                });
        }

        self.delay = function delay(sec) {
            var deferred = $q.defer();
            $interval(function() {
                deferred.resolve(true);
            }, sec * 1000, false);
            return deferred.promise;
        };

        self.SyncAppResources = function() {
            Timer.start('Synchronize', 'Resources', 'App');
            return $q.all([
                __synchronizeResource(AppResourceDB.getByType, "errormessages", apiService.getErrorMessage, AppResourceDB.AddOrUpdate).then(function(data) {
                    Timer.end('Synchronize', 'Resources', 'errormessages');
                    if (angular.isArray(data)) {
                        if (data) {
                            data.forEach(function(item) {
                                $rootScope.Messages[item.token] = item.message;
                            });
                        }
                    }
                }),
                __synchronizeResource(AppResourceDB.getByType, "GetTemplates", apiService.getTemplates, AppResourceDB.AddOrUpdate).then(function() {
                    Timer.end('Synchronize', 'Resources', 'GetTemplates');
                })
            ]).then(function() {
                Timer.end('Synchronize', 'Resources', 'App');
            });
        };

        self.SyncOrgResources = function() {
            Timer.start('Synchronize', 'Resources', 'Org');

            function dbInvoker(resourceType) {
                return OrgResourceDB.getByType($rootScope.user.orgId, resourceType);
            }

            var resources = ['category', 'location', 'jobtype', 'errormessages', 'checklist', 'question'];

            return $q.all(
                resources.map(function(resource) {
                    return __synchronizeResource(dbInvoker, resource, function(timeStamp) {
                        return apiService.retrieveData($rootScope.user.sessionId, resource, timeStamp);
                    }, OrgResourceDB.AddOrUpdate).then(function(data) {
                        Timer.end('Synchronize', 'Resources', resource);
                        return data;
                    });
                })).then(function(data) {
                var errormessages = data[3];
                errormessages.forEach(function(item) {
                    $rootScope.Messages[item.token] = item.message;
                });
            }).then(function() {
                Timer.end('Synchronize', 'Resources', 'Org');
            });
        };



        self.SyncNotifications = function() {
            function dbInvoker(resourceType) {
                return UserResourceDB.getByType($rootScope.user.userId, resourceType);
            }

            return __synchronizeResource(dbInvoker, "notification", function(timeStamp) {
                return apiService.retrieveData($rootScope.user.sessionId, "notification", timeStamp);
            }, UserResourceDB.AddOrUpdate).then(function() {
                Timer.end('Synchronize', 'Resources', 'notification');
            });
        };

        self.CleanDb = function() {
            return $q.all([OrgResourceDB.deleteAll($rootScope.user.orgId), 
                UserResourceDB.deleteAll($rootScope.user.userId), 
                AppResourceDB.deleteAll(), 
                AttachmentDB.deleteByOrgId($rootScope.user.orgId),
                SurveyDB.deleteByUserId($rootScope.user.userId)]);
        };

        self.SyncUserResources = function() {
            Timer.start('Synchronize', 'Resources', 'User');

            return self.SyncNotifications()
                .then(self.SyncAttachments)
                .then(self.SyncSurveys)
                .then(function() {
                    Timer.end('Synchronize', 'Resources', 'survey');
                    Timer.end('Synchronize', 'Resources', 'User');
                });
        };

        self.InitializeBackgroundSynchronizer = function() {
            self.timerEnabled = true;
            $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
        };

        self.DisableBackgroundSynchronizer = function() {
            self.timerEnabled = false;
        };

        self.__synchronize = function() {
            if ($rootScope.isOnline && self.timerEnabled && $rootScope.user && $rootScope.user.userId) {

                if ($state.is('app.survey') || $state.is('app.assignedSurvey')) {
                    $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 6 * 1000);
                    return;
                }

                return self.SyncQueue()
                    .then(function() {
                        if (!$rootScope.SyncError) {
                            self.SyncOrgResources()
                                .then(self.SyncUserResources)
                                .then(function() {
                                    $rootScope.$broadcast('Synchronized', $rootScope);
                                    $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
                                });
                        }
                    }).catch(function(e) {
                        $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
                    });
            } else {
                $timeout(self.__synchronize, $rootScope.selectedOrg.syncInterval * 60 * 1000);
            }

        };

        function _SyncQueue() {
            return QueueDB.length($rootScope.user.userId)
                .then(function(no) {
                    if (no > 0) {
                        return ProcessQueue().then(function() {
                            if ($rootScope.SyncError) {
                                return false;
                            }
                            return _SyncQueue();
                        });
                    }
                });
        }

        self.SyncQueue = function() {
            var deferred = $q.defer();

            $rootScope.SyncError = false;

            if ($rootScope.isOnline) {
                if (!$rootScope.isQueueProcessing) {
                    $rootScope.syncDeferred = deferred;
                    $rootScope.isQueueProcessing = true;
                    _SyncQueue()
                        .then(function() {
                            // if ($rootScope.SyncError) {
                            //     //Opportunity to return a message to end user over here
                            // }
                            $rootScope.isQueueProcessing = false;
                            deferred.resolve(true);
                        });
                } else {
                    deferred = $rootScope.syncDeferred;
                }
            } else {
                deferred.resolve(true);
            }
            return deferred.promise;
        };

        function ProcessQueue() {
            return QueueDB.getTopItem($rootScope.user.userId)
                .then(function(queueItem) {
                    return apiService.__post(JSON.parse(queueItem.message))
                        .then(function(data) { //then will ensure - irrespective of success/error message will always be deleted
                            return QueueDB.delete(queueItem.id);
                        }).catch(function(e) {
                            $rootScope.SyncError = true;
                            return false;
                        });
                });
        }
        return self;
    }

    Synchronizer.$inject = ['$rootScope', 'QueueDB', 'OrgResourceDB', 'AppResourceDB', 'UserResourceDB', 'SurveyDB', 'Timer', 'apiService', '$q', '$timeout', '$interval', 'AttachmentDB', '$state', '$ionicPopup'];
    angular.module('healthApp.services').factory('Synchronizer', Synchronizer);
}());
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


(function() {
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function QueuingService(QueueDB, Analytics, $rootScope, $q) {
        function __generateUUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        }

        function addToQueue(data) {
            return QueueDB.push({
                    userId: $rootScope.user.userId,
                    message: angular.toJson(data)
                })
                .then(function() {
                    $rootScope.$broadcast("MESSAGE_ADDED");
                });
        }

        function createIssue(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "issue",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'issue',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function deleteNotification(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Delete",
                label: "notification",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'notification',
                action: 'delete',
                object: null
            });
        }

        function createSurvey(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "survey",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'survey',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function updateSurvey(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Update",
                label: "survey",
                value: data.id
            });

            if (data.status) {
                Analytics.trackEvent({
                    category: "API",
                    action: "Draft",
                    label: "survey",
                    value: data.id
                });
            }

            if (data.dateOfCompletion) {
                Analytics.trackEvent({
                    category: "API",
                    action: "Complete",
                    label: "survey",
                    value: data.id
                });
            }

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'survey',
                action: 'update',
                object: angular.toJson(data)
            });
        }

        function createIssueAttachments(images) {
            return $q.all(images.map(function(image) {
                var id = image.id;

                Analytics.trackEvent({
                    category: "API",
                    action: "Create",
                    label: "issueattachment",
                    value: id
                });


                return addToQueue({
                    identifier: id,
                    sessionId: $rootScope.user.sessionId,
                    request: 'Sync',
                    datasource: 'issueattachment',
                    action: 'create',
                    object: angular.toJson(image)
                });
            }));
        }

        function deleteIssueAttachment(id) {
            Analytics.trackEvent({
                    category: "API",
                    action: "Delete",
                    label: "issueattachment",
                    value: id
                });

            return addToQueue({
                identifier: id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'issueattachment',
                action: 'delete',
                object: null
            });
        }

        function deleteIssueAttachments(images) {
            return $q.all(images.map(function(image) {
                deleteIssueAttachment(image.id);
                delete image.id;
            }));
        }

        function createAnswer(data) {
            Analytics.trackEvent({
                category: "API",
                action: "Create",
                label: "answer",
                value: data.id
            });

            return addToQueue({
                identifier: data.id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'answer',
                action: 'create',
                object: angular.toJson(data)
            });
        }

        function deleteAnswer(id) {
        	Analytics.trackEvent({
                category: "API",
                action: "Delete",
                label: "answer",
                value: id
            });

            return addToQueue({
                identifier: id,
                sessionId: $rootScope.user.sessionId,
                request: 'Sync',
                datasource: 'answer',
                action: 'delete',
                object: null
            });
        }

        

        return {
        	getId : __generateUUID,
        	addToQueue : addToQueue,
        	createIssue : createIssue,
        	deleteNotification : deleteNotification,
        	createSurvey : createSurvey,
        	updateSurvey : updateSurvey,
        	createIssueAttachments : createIssueAttachments,
        	deleteIssueAttachments : deleteIssueAttachments,
        	deleteIssueAttachment : deleteIssueAttachment,
        	createAnswer : createAnswer,
        	deleteAnswer : deleteAnswer
        };

    }

    QueuingService.$inject = ['QueueDB', 'Analytics', '$rootScope', '$q'];
    angular.module('healthApp.services').factory('QueuingService', QueuingService);
}());
     
(function() {
    // "use strict";
    // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser

    function PostService(QueuingService, UserResourceDB, SurveyDB, $rootScope, $q, AttachmentDB) {
        var self = this;
        var noImage = "images/no-picture.gif";

        self.getId = QueuingService.getId;

        self.DeleteAnswer = function(id) {
            return QueuingService.deleteAnswer(id);
        };

        self.SaveQuickIssue = function(data) {
            var issue = {
                id: QueuingService.getId(),
                categoryID: data.categoryID,
                locationID: data.locationID,
                description: data.description,
                actionPlan: data.actionPlan,
                source: data.source,
                resolved: data.resolved ? "Y" : "N",
                resolutionDate: data.resolved ? new Date() : null
            };

            var images = [];
            var noImage = "images/no-picture.gif";

            for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                if (data['imgURI' + i] !== noImage) {
                    var identifier = QueuingService.getId();
                    images.push({
                        id: identifier,
                        //identifier: identifier,
                        issueID: issue.id,
                        filename: identifier + ".jpeg",
                        picture: data['imgData' + i]

                    });
                }
            }

            return QueuingService.createIssue(issue)
                .then(QueuingService.createIssueAttachments(images));
        };

        self.DeleteNotification = function(notification) {
            var currentNotifications = [];
            return QueuingService.deleteNotification(notification)
                .then(function() {
                    return UserResourceDB.getByType($rootScope.user.userId, 'notification');
                })
                .then(function(notifications) {
                    notifications.resource = JSON.parse(notifications.resource);
                    var index = notifications.resource.findIndex(function(e, i, a) {
                        return e.id === notification.id;
                    });
                    if (index > -1) {
                        notifications.resource.splice(index, 1);
                    }
                    currentNotifications = notifications.resource;
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.notification = currentNotifications.length;
                    return UserResourceDB.AddOrUpdate(notifications);
                })
                .then(function() {
                    return currentNotifications;
                });
        };

        self.DeleteAllNotification = function() {
            var data = { id: 'all' };
            return QueuingService.deleteNotification(data)
                .then(function() {
                    return UserResourceDB.getByType($rootScope.user.userId, 'notification');
                }).then(function(notifications) {
                    notifications.resource = [];
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.notification = 0;
                    return UserResourceDB.AddOrUpdate(notifications);
                });
        };

        self.SaveAnswer = function(answer, question, survey) {
            var oAnswer = {
                id: answer.id,
                surveyID: survey.id,
                questionID: question.id,
                uniqueID: answer.uniqueID,
                jobTypeID: answer.jobTypeID,
                freeText: answer.freeText,
                compliant: answer.compliant
            };

            return QueuingService.createAnswer(oAnswer)
                .then(function() {
                    if (answer.compliant === "NC") {
                        //save issue and issueattachment if any
                        var oIssue = {
                            id: answer.issue.id,
                            actionPlan: answer.issue.actionPlan,
                            answerID: oAnswer.id,
                            description: oAnswer.freeText,
                            source: '',
                            resolutionDate: answer.issue.resolutionDate || (answer.Resolved ? new Date() : null),
                            resolved: answer.issue.resolved //? "Y" : "N"
                        };

                        var images = [];
                        var deleteImages = [];

                        if (answer.issue.images.deleteImages) {
                            answer.issue.images.deleteImages.forEach(function(id) {
                                deleteImages.push({
                                    id: id,
                                    issueID: oIssue.id
                                });
                            });
                        }

                        for (var i = 0; i <= 2; i++) { //TODO: Number 2 is hardcoded over here.
                            if (answer.issue.images['imgURI' + i] !== noImage && !answer.issue.images['imageId' + i] && answer.issue.images['imgData' + i]) {

                                var identifier = QueuingService.getId();
                                images.push({
                                    id: identifier,
                                    //identifier: identifier,
                                    issueID: oIssue.id,
                                    filename: identifier + ".jpeg",
                                    picture: answer.issue.images['imgData' + i]
                                });
                                answer.issue.issueAttachment.push(identifier);
                                answer.issue.images['imageId' + i] = identifier;
                                answer.issue.images['_imgData' + i] = answer.issue.images['imgData' + i];
                                answer.issue.images['imgData' + i] = null;
                            }
                        }

                        QueuingService.deleteIssueAttachments(deleteImages)
                            .then(function() {
                                return $q.all(deleteImages.map(function(item) {
                                    AttachmentDB.deleteById(item.id);
                                }));
                            });

                        updateImagesInDb(images, survey)
                            .then(function() {
                                return QueuingService.createIssue(oIssue);
                            }).then(function() {
                                return QueuingService.createIssueAttachments(images);
                            });
                    }
                });
        };

        function updateImagesInDb(images, survey) {
            return $q.all(images.map(function(item) {
                AttachmentDB.add({
                    attachmentId: item.id,
                    surveyId: survey.id,
                    ext: 'jpeg',
                    data: item.picture,
                    bigData: item.picture,
                    orgId: $rootScope.user.orgId
                });
            }));
        }

        self.UpdateSurveyInMemory = function(data) {
            return SurveyDB.update({
                surveyId: data.id,
                userId: $rootScope.user.userId,
                checklist: data.checklist,
                location: data.location,
                dueDate: data.dueDate,
                _status: data.status === "T" ? "Draft" : "Open",
                tempId: data.tempId,
                json: angular.toJson(data)
            });
        };

        self.AddSurveyInDB = function(data) {
            return SurveyDB.add({
                surveyId: data.id,
                userId: $rootScope.user.userId,
                checklist: data.checklist,
                location: data.location,
                dueDate: data.dueDate,
                _status: data.status === "T" ? "Draft" : "Open",
                tempId: data.tempId,
                json: angular.toJson(data)
            });
        };

        self.CreateSurvey = function(data) {
            data.id = QueuingService.getId();

            var survey = {
                locationID: data.locationID,
                checklistID: data.checklistID,
                status: data.status,
                id: data.id,
                isCreatedOnDevice: true
            };

            return QueuingService.createSurvey(survey)
                .then(function() {
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.survey = $rootScope.resourcesCount.survey + 1;
                    data.tempId = data.id;
                    return self.AddSurveyInDB(data);
                }).then(function() {
                    return data.id;
                });
        };

        self.SaveSurveyWithStatus = function(survey) {
            var oSurvey = {
                id: survey.id,
                locationID: survey.locationID,
                checklistID: survey.checklistID,
                status: survey.status
            };

            return QueuingService.updateSurvey(oSurvey)
                .then(function() {
                    return self.UpdateSurveyInMemory(survey);
                });
        };

        self.UpdateSurvey = function(survey) {
            var oSurvey = {
                id: survey.id,
                locationID: survey.locationID,
                checklistID: survey.checklistID,
                dateOfCompletion: new Date(),
                defaultAnswer: survey.defaultAnswer
            };

            return QueuingService.updateSurvey(oSurvey)
                .then(function() {
                    $rootScope.resourcesCount = $rootScope.resourcesCount || {};
                    $rootScope.resourcesCount.survey = $rootScope.resourcesCount.survey - 1;
                    return $q.all([SurveyDB.deleteById($rootScope.user.userId, survey.id),
                        AttachmentDB.deleteBySurveyId(survey.id)
                    ]);
                });
        };

        return self;
    }

    PostService.$inject = ['QueuingService', 'UserResourceDB', 'SurveyDB', '$rootScope', '$q', 'AttachmentDB'];
    angular.module('healthApp.services').factory('PostService', PostService);

}());
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
angular.module('healthApp.services')
    .factory('SecuredPopups', [
        '$ionicPopup',
        '$q',
        function($ionicPopup, $q) {

            var firstDeferred = $q.defer();
            firstDeferred.resolve();

            var lastPopupPromise = firstDeferred.promise;

            return {
                'show': function(method, object) {
                    var deferred = $q.defer();

                    lastPopupPromise.then(function() {
                        $ionicPopup[method](object).then(function(res) {
                            deferred.resolve(res);
                        });
                    });

                    lastPopupPromise = deferred.promise;

                    return deferred.promise;
                },
                'showConditional' : function(method, object, condition){
                    var deferred = $q.defer();

                    lastPopupPromise.then(function() {
                        if (condition()){
                            $ionicPopup[method](object).then(function(res) {
                                deferred.resolve(res);
                            });
                        } else {
                            deferred.resolve(false);
                        }
                        
                    });

                    lastPopupPromise = deferred.promise;

                    return deferred.promise;
                }
            };
        } 
    ]);