(function () {
    'use strict';

    angular.module('starter').controller('fbController', ['$scope', '$rootScope', '$ionicPopup', '$state', 'authenticationService', 'applicationLocalStorageService', 'serviceApi', 'GENERAL_CONFIG', '$ionicModal', fbController]);
    function fbController($scope, $rootScope, $ionicPopup, $state, authenticationService, applicationLocalStorageService, serviceApi, GENERAL_CONFIG, $ionicModal) {
        var emailAlerts = false;

        if (applicationLocalStorageService.checkKey('username'))
            $scope.name = applicationLocalStorageService.getCache('username');

        if (applicationLocalStorageService.checkKey('email'))
            $scope.email = applicationLocalStorageService.getCache('email');
        if (applicationLocalStorageService.checkKey('gender'))
            $scope.gender = applicationLocalStorageService.storeCache('gender');
        if (applicationLocalStorageService.checkKey('token'))
            $scope.token = applicationLocalStorageService.storeCache('token');
        $scope.fbsignupForm = {
            "phonebox1": '',
            "phonebox2": '',
            "phonebox3": '',
            emailSaving : {},
            textMsgSavings: {}
        };
        $scope.valid = '';
        $scope.fbsignup = function (user) {
            console.log('Sign-Up', $scope.fbsignupForm.userName);
            var emailAlerts = Boolean($scope.fbsignupForm.emailSaving.checked | false),
				textMsgSavings = Boolean($scope.fbsignupForm.textMsgSavings.checked | false),
				phone1 = $scope.fbsignupForm.phonebox1,
				phone2 = $scope.fbsignupForm.phonebox2,
				phone3 = $scope.fbsignupForm.phonebox3;
            if(textMsgSavings == false){
                    phone1= "";
                    phone2= "";
                    phone3= "";
                }
            var datatosend = {
                "Name": ($scope.name == undefined) ? "" : $scope.name,
                "Email": ($scope.email == undefined) ? "" : $scope.email,
                "ZipCode": $scope.fbsignupForm.zip,
                "Age": ($scope.fbsignupForm.age == undefined) ? 0 : $scope.fbsignupForm.age,
                "Gender": ($scope.gender == undefined) ? "" : $scope.gender,
                "EmailAlerts": (emailAlerts == undefined) ? false : emailAlerts,
                "TextAlerts": (textMsgSavings == undefined) ? false : textMsgSavings,
                "PhoneNumber": phone1.toString() + phone2.toString() + phone3.toString(),
                "Provider": "Facebook",
                "ProviderToken": $scope.token
            };
            console.log("signup data", datatosend);
            serviceApi.signUpCTRL(datatosend)
			.then(function (response) {
			    console.log("signup", response);
			    if (response == '204') {
			    }
			    else {
			        if (response == "true" || response == true) {
			            $scope.userName = datatosend.Name;
			            console.log($scope.userName);
                        localStorage.setItem("Zipcode",$scope.fbsignupForm.zip);
			            localStorage.setItem("isLogin", "true");
			            $state.go('app.banner', { userName: $scope.userName });
			        }
			    }
			},
			function (err) {
			    console.log("error in signup");
			});


        };


        $scope.fnPolicyPopup = function () {
            // An elaborate, custom popup
			document.activeElement.blur();
            var myPopup = $ionicPopup.show({
                templateUrl: 'app/terms/terms.html',
                //title: 'Terms',
                cssClass: 'termsPopup',
                scope: $rootScope,
                buttons: [
                  {
                      text: '<strong>Ok</strong>',
                      type: 'button-positive',
                      onTap: function (e) {
                          return;
                      }
                  },
                ]
            });
            
        };

        $scope.showTermsPopup = function (myValue) {
  			document.activeElement.blur();
            if (!$scope.fbsignupForm.textMsgSavings.checked) {
                return;
            }

            $scope.data = {}

            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                templateUrl: 'app/terms/privacy.html',
                cssClass: 'privacyPopup',
                scope: $rootScope,
                buttons: [
                  {
                      text: 'Decline',
                      onTap: function (e) {
                          $scope.fbsignupForm.textMsgSavings.checked = false;
                          return;
                      }
                  },
                  {
                      text: '<b>Accept</b>',
                      type: 'button-positive',
                      onTap: function (e) {
                          $scope.fbsignupForm.textMsgSavings.checked = true;
                      }
                  },
                ]
            });
  
            return $scope.fbsignupForm.textMsgSavings.checked = !$scope.fbsignupForm.textMsgSavings.checked;
        };
        $scope.numericvalidation = function ($event, maxLength) {


            $scope.valid = false;
            var data = event.target.value.toString();
            if (data.length >= maxLength) {
            event.target.value = event.target.value.toString().slice(0, maxLength);
            $scope.fbsignupForm.zip =event.target.value;

                $scope.valid = true;
            }
        };

    }

})();
