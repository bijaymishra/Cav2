(function () {
    'use strict';
    angular.module('starter').controller('test', function ($scope) {

    });

    angular.module('starter').controller('signupController', ['$scope', '$rootScope', '$ionicPopup', '$state', 'authenticationService', 'serviceApi', 'sqliteService', 'GENERAL_CONFIG', '$ionicModal','applicationLocalStorageService', signupController]);
    function signupController($scope, $rootScope, $ionicPopup, $state, authenticationService, serviceApi, sqliteService, GENERAL_CONFIG, $ionicModal,applicationLocalStorageService) {
    	//cash banner images and topcategories details.
    	 if (!applicationLocalStorageService.checkKey('BannerList')) {
            serviceApi.getBanners();
        }

        if (!applicationLocalStorageService.checkKey('TopCategorylist')) {
            serviceApi.getTopCategory();
       }
        $scope.myValue = true;
        $scope.signupForm = {
            "phonebox1": '',
            "phonebox2": '',
            "phonebox3": '',
            emailSaving : {},
            textMsgSavings: {}

        };
        $scope.signup = function (user) {

            var emailAlerts = Boolean($scope.signupForm.emailSaving.checked | false),
				textMsgSavings = Boolean($scope.signupForm.textMsgSavings.checked | false),
				phone1 = $scope.signupForm.phonebox1,
				phone2 = $scope.signupForm.phonebox2,
				phone3 = $scope.signupForm.phonebox3;
            	if(textMsgSavings == false){
            		phone1= "";
		            phone2= "";
		            phone3= "";
            	}
            var datatosend = {
                "Name": $scope.signupForm.userName,
                "Email": $scope.signupForm.email.toLowerCase(),
                "ZipCode": $scope.signupForm.zip,
                "Age": ($scope.signupForm.age == undefined) ? 0 : $scope.signupForm.age,
                "Gender": ($scope.signupForm.gender == undefined) ? "" : $scope.signupForm.gender,
                "EmailAlerts": (emailAlerts == undefined) ? false : emailAlerts,
                "TextAlerts": (textMsgSavings == undefined) ? false : textMsgSavings,
                "PhoneNumber": phone1 + phone2 + phone3,
                "Provider": "manual",
                "ProviderToken": ""
            };
            serviceApi.signUpCTRL(datatosend)
			.then(function (response) {
			    if (response == '204') {
			    }
			    else {
			        if (response == true || response == "true") {
			            localStorage.setItem("isLogin", "true");
                        localStorage.setItem("Zipcode",$scope.signupForm.zip);
			            //Check if the user is properly register and has is already seen the intro screen.
			            //Match the current version with saved and display intro screens
			            sqliteService.query('SELECT * FROM generic where key = "IsIntroSkipVersion"').then(function (result) {
			                if ((result.rows.length > 0 && GENERAL_CONFIG.APP_VERSION != result.rows[0].value)
                                || (result.rows.length == 0)) {
			                    $state.go('intro');
			                }
			                else {
			                    $state.go('app.banner');
			                }
			            });
			        }
			    }
			},
			function (err) {
			    console.log("error in signup");
			});
        };

        $scope.signup.showTermsPopup = function (myValue) {
			document.activeElement.blur();
            if (!$scope.signupForm.textMsgSavings.checked) {
                return;
            }
		
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                templateUrl: 'app/terms/privacy.html',
                cssClass: 'privacyPopup',
                scope: $rootScope,
                buttons: [
                  {
                      text: 'Decline',
                      onTap: function (e) {
                          //$scope.myValue = $;
                          $scope.signupForm.textMsgSavings.checked = false;
                          return;
                      }
                  },
                  {
                      text: '<b>Accept</b>',
                      type: 'button-positive',
                      onTap: function (e) {
                          $scope.signupForm.textMsgSavings.checked = true;
                      }
                  },
                ]
            });
           

            return $scope.signupForm.textMsgSavings.checked = !$scope.signupForm.textMsgSavings.checked;
        };

        $scope.signup.fnPolicyPopup = function () {
			document.activeElement.blur();
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                templateUrl: 'app/terms/terms.html',
                cssClass: 'termsPopup',
                //title: 'Terms',
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
    };
})();

