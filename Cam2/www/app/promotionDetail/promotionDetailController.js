(function () {
    'use strict';

    angular.module('starter').controller('promotionDetailController', ['$scope', '$rootScope', '$ionicActionSheet', '$state', 'serviceApi', 'applicationLocalStorageService', 'commonHelper', '$stateParams', '$ionicPopup', promotionDetailController]);

    function promotionDetailController($scope, $rootScope, $ionicActionSheet, $state, serviceApi, applicationLocalStorageService, commonHelper, $stateParams, $ionicPopup) {
        console.log('In promotion Controller');

        $rootScope.showActionsheet = function () {

            $ionicActionSheet.show({
                titleText: 'Share',
                buttons: [
                  { text: '<div class="email-btn"> <a onclick="app.fnEmailShare();" href="javascript:void(0);" id="id_email_share" class="btn btn-secondary btn-lg btn-block"><i class="email-icon"></i>Email</a> </div>' },
                ],
                cancelText: '<div class="share-footer">Cancel</div>',
                cancel: function () {
                    // TBD
                },
                buttonClicked: function (index) {
                    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
                    if (iOS) {
                        cordova.plugins.email.open({
                            to: '',
                            subject: 'Check out the Cash America app',
                            body: '<p>CashAmerica has an app! Download it to find unique items and get special offers.' +
                                    '<br>I have it, and I love it.<br><br><p align="center"><a style="text-decoration: none;" href="http://play.google.com/store/apps/details?id=com.cashamericaprod"><img src="http://www.cashamerica.com/images/mobile/en_generic_rgb_wo_60.png" width="122px" height="41px"></a><span style="font-size:12px;display:block;">Google Play is a trademark of Google Inc.</span></p><p align="center">' +
                                    '<a style="text-decoration: none;" href="http://itunes.com/apps/CashAmerica"><img src="http://www.cashamerica.com/images/mobile/Download_on_the_App_Store_Badge_US-UK_135x40.png" width="122px" height="41px" ></a><span style="font-size:12px;display:block;">App Store is a service mark of Apple Inc.</span></p>',
                            isHtml: true
                        });
                    }
                    else {
                        cordova.plugins.email.open({
                            to: '',
                            subject: 'Check out the Cash America app',
                            body: '<p>CashAmerica has an app! Download it to find unique items and get special offers.' +
                                     '<br>I have it, and I love it.<br><br><p align="center"><a href="http://play.google.com/store/apps/details?id=com.cashamericaprod">Google Play</a></p><p align="center">' +
                                     '<a href="http://itunes.com/apps/CashAmerica">App Store</a></p>',
                            isHtml: true
                        });
                    }
                    return true;
                },
                destructiveButtonClicked: function () {
                    return true;
                }
            });
        };


        $scope.promotionId = $stateParams.promoId;

        if (!applicationLocalStorageService.checkKey('PromotionDetail_' + $scope.promotionId)) {
            serviceApi.getOffer($scope.promotionId)
            .then(function (response) {
                $scope.offerDetail = response;
                applicationLocalStorageService.storeCache('PromotionDetail_' + $scope.promotionId, response);
            },
            function (err) {
            });
        }
        else {
            $scope.offerDetail = applicationLocalStorageService.getCache('PromotionDetail_' + $scope.promotionId);
        }

        if (!applicationLocalStorageService.checkKey('TermsText_' + $scope.promotionId)) {
         serviceApi.getOfferTerms($scope.promotionId)
             .then(function (response) {
                $scope.seeterms = response;
                applicationLocalStorageService.storeCache('TermsText_' + $scope.promotionId, response);
             },
            function (err) {
            });
         }
         else
         {
            $scope.seeterms = applicationLocalStorageService.getCache('TermsText_' + $scope.promotionId);
         }
        $scope.getPromotionTerms = function () {
            if (!applicationLocalStorageService.checkKey('TermsText_' + $scope.promotionId)) {

                 serviceApi.getOfferTerms($scope.promotionId)
                    .then(function (response) {
                    $scope.seeterms = response;
                    applicationLocalStorageService.storeCache('TermsText_' + $scope.promotionId, response);
                    $scope.openpopup();
                 },
                function (err) {
                });
                
            }
            else
            {
                $scope.seeterms = applicationLocalStorageService.getCache('TermsText_' + $scope.promotionId);
                $scope.openpopup();
            }

           
        };
        $scope.openpopup = function()
        {
            var myPopup = $ionicPopup.show({
                     // template: '',
                     // title: 'Terms',
                     subTitle: $scope.seeterms,
                     scope: $scope,
                     buttons: [{ text: 'Close' }]
                 });
                 myPopup.then(function (res) {
                     // console.log('Tapped!', res);
                 });
        }

        $scope.fnopenWebsite = function () {
            var ref = window.open($scope.offerDetail.linkURL, '_blank', 'location=yes');
        };
    }
})();