// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('starter', ['ionic', 'angular-cache', 'ngCordova', 'starter.config', 'underscore'])
//angular.module('starter', ['ionic', 'starter.controllers'])

.config(function (CacheFactoryProvider) {
    angular.extend(CacheFactoryProvider.defaults, {
        maxAge: 55 * 60 * 1000,
        deleteOnExpire: 'aggressive',
        recycleFreq: 60000,
        storageMode: 'localStorage',
        onExpire: function (key, value) {
            CacheFactoryProvider.destroy(key);
        }
    });
})
.run(function ($ionicPlatform, CacheFactory, sqliteService, $cordovaGoogleAnalytics,$ionicHistory,$rootScope,geolocationService,$ionicPopup) {

    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        if(window.cordova && ionic.Platform.isIOS())
            navigator.splashscreen.hide();
        sqliteService.init();
        
        geolocationService().then(function (position) {
                
                $rootScope.Latitude = position.coords.latitude;
                $rootScope.longitude = position.coords.longitude;

            }, function(error) {
                var myPopup = $ionicPopup.show({
                     // template: '',
                     // title: 'Terms',
                     subTitle: "We cannot determine your location. To fix this, go to Location Settings and turn on location services for the Cash America app.",
                     buttons: [{ text: 'Close' }]
                 });
                
            });
        ///back button handle
        $ionicPlatform.registerBackButtonAction(function (event) {
    
        if($ionicHistory.currentStateName() == "app.banner" || $ionicHistory.currentStateName()=="intro" || $ionicHistory.currentStateName()=="home"){
                ionic.Platform.exitApp();
          // or do nothing
         }
        else {
          $ionicHistory.goBack();
        }
      }, 100);
      $ionicPlatform.on("resume", function(event) {
            
            $rootScope.$broadcast("resume");
      });
      if(window.Connection) {
            if(navigator.connection.type == Connection.NONE) {
                var myPopup = $ionicPopup.show({
                     title: "Internet Disconnected",
                     subTitle: "The internet is disconnected on your device.",
                     buttons: [{ text: 'Close' }]
                 });
                 myPopup.then(function (res) {
                     // console.log('Tapped!', res);
                 });
                }
        }
        //$ionicPlatform.registerBackButtonAction(function (event) {
        //    navigator.notification.confirm("Are you sure you want to exit ?", function (button) {
        //        if (button == 2) { //If User selected No, then we just do nothing
        //            return;
        //        } else {
        //            navigator.app.exitApp(); // Otherwise we quit the app.
        //        }
        //    }, "Confirmation", "Yes,No");
        //}, 100);
    });
})

.run(function ($rootScope, $ionicHistory,GENERAL_CONFIG, $cordovaGoogleAnalytics) {

    $rootScope.$on('$stateChangeSuccess', function () {
        if(GENERAL_CONFIG.GA_enabled == true || GENERAL_CONFIG.GA_enabled == "true")
        {
        var page = $ionicHistory.currentStateName().split(".").pop(-1);
        console.log(page);
        console.log(GENERAL_CONFIG.SCREEN_NAME[page]);
        if (window.cordova) {
            
                if (typeof analytics !== 'undefined') 
                {
                console.log("track");
                $cordovaGoogleAnalytics.startTrackerWithId('UA-63195934-1');
                if(GENERAL_CONFIG.SCREEN_NAME[page])
                $cordovaGoogleAnalytics.trackView(GENERAL_CONFIG.SCREEN_NAME[page]);
                }
            }
        }
    });
})

.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "app/layout/menu.html",
        controller: 'menuContoller'
    })

     .state('start', {
         url: "/start",
         abstract: true,
         templateUrl: "app/layout/startLayout.html",
     })


      .state('signin', {
          url: '/signin',
          templateUrl: 'app/authentication/sign-in.html',
          controller: 'loginController'
      })

      .state('signup', {
          url: '/signup',
          templateUrl: 'app/authentication/sign-up.html',
          controller: 'signupController'
      })
      .state('facebook', {
          url: "/facebook",
          templateUrl: "app/authentication/facebooksignup.html",
          controller: 'fbController'
      })

      .state('intro', {
          url: "/intro",
          templateUrl: "app/intro/intro.html",
          controller: 'introController'
      })
      .state('home', {
          url: "/home",
          templateUrl: "app/home/home.html",
          controller: 'homeController',
          //resolve: {
          //    myResolve1:
          //      function ($q, $state) {
          //          console.log('resove');
          //          //$state.go('app.banner');
          //          var deferred = $q.defer();
          //          $state.go('app.banner');
          //          //if (localStorage.getItem('isLogin')) {
          //          //return ;
          //          //}

          //          return deferred.reject();
          //      }
          //}
          //resolve: function ($q, $state) {
          //    var deferred = $q.defer();
          //    deferred.resolve();
          //    //if (localStorage.getItem('isLogin')) {
          //    $state.go('app.banner');
          //    //}

          //    return deferred.promise;
          //    //console.log(localStorage.getItem('isLogin'));
          //}
      })
      .state('app.banner', {
          url: "/banner",
          views: {
              'menuContent': {
                  templateUrl: "app/banner/banner.html",
                  controller: 'bannerController'
              }
          }
      })
      .state('app.saveitems', {
          cache: true,
          url: "/saveitems",
          views: {
              'menuContent': {
                  templateUrl: "app/saveitems/saveitem.html",
                  controller: 'saveItemController'
              }
          }
      })
      .state('app.inventory', {
          url: "/inventory",
          views: {
              'menuContent': {
                  templateUrl: "app/inventory/inventory.html",
                  controller: 'inventoryController as vm',
              }
          }
      })

      .state('app.inventoryItem', {
          cache: true,
          url: "/inventoryItem/:itemcategoryName/:itemcategoryCode",
          views: {
              'menuContent': {
                  templateUrl: "app/inventory/inventoryItem.html",
                  controller: 'inventoryItemController as vm',
              }
          }
      })
          .state('app.itemList', {
              cache: true,
              url: "/itemList/:categoryCode?searchterm?categoryName?from",
              views: {
                  'menuContent': {
                      templateUrl: "app/items/itemList.html",
                      controller: 'itemListController as vm',
                  }
              }
          })
        .state('app.storeDetail', {
            url: "/storeDetail/:storeId?from",
            views: {
                'menuContent': {
                    templateUrl: "app/storeDetail/storeDetail.html",
                    controller: 'storeDetailController as vm',
                }
            }
        })
      .state('app.stores', {
          cache: true,
          url: "/stores",
          views: {
              'menuContent': {
                  templateUrl: "app/stores/stores.html",
                  controller: 'storesController as vm',
              }
          }
      })
      .state('app.promotions', {
          url: "/promotions",
          views: {
              'menuContent': {
                  templateUrl: "app/promotions/promotions.html",
                  controller: 'promotionsController as vm',
              }
          }
      })
       .state('app.promotionDetail', {
           url: "/promotiondetail/:promoId",
           views: {
               'menuContent': {
                   templateUrl: "app/promotionDetail/promotionDetail.html",
                   controller: 'promotionDetailController as vm',
               }

           }
       })
       .state('app.privacy', {
           url: "/privacy",
           views: {
               'menuContent': {
                   templateUrl: "app/privacy/privacy.html",
                   controller: 'privacyController as pr',
               }
           }
       })
	   .state('app.about', {
           url: "/about",
           views: {
               'menuContent': {
                   templateUrl: "app/about/about.html",
                   controller: 'aboutController as vm',
               }
           }
       })

    // if none of the above states are matched, use this as the fallback
    //$urlRouterProvider.otherwise('home')
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("intro");
    });
})
    .run(['$state', '$rootScope', function ($state, $rootScope) {
        $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState, fromParams) {
            if (toState.name.indexOf('intro') > -1) {
                // If logged out and transitioning to a logged in page:
                var isLogin = localStorage.getItem('isLogin');
                var skip = localStorage.getItem('skippBanner');
                if (typeof isLogin !== 'undefined' && isLogin !== null) {
                    e.preventDefault();
                    $state.go('app.banner');
                }
                else if(typeof skip !== 'undefined' && skip !== null)
                {
                    e.preventDefault();
                    $state.go('home');

                }
            }
            //else if (toState.name.indexOf('public') > -1 && $cookies.Session) {
            //    // If logged in and transitioning to a logged out page:
            //    e.preventDefault();
            //    $state.go('tool.suggestions');
            //};
        });
    }])
.config(function ($ionicConfigProvider,GENERAL_CONFIG) {
    ionic.Platform.ready(function() {
    if (!ionic.Platform.isIOS()) {
        if(GENERAL_CONFIG.S3_Models.indexOf(device.model)== -1)
        {
            console.log("scroll false");
            $ionicConfigProvider.scrolling.jsScrolling(false);
        }
    }       
    });
    if(ionic.Platform.isIOS())
    {
        $ionicConfigProvider.views.swipeBackEnabled(false);
    }
});
