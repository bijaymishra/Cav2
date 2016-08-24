(function () {
    'use strict';

    angular.module('starter').controller('loginController', ['$scope', '$state', 'authenticationService','serviceApi', 'applicationLocalStorageService', loginController]);

    function loginController($scope, $state, authenticationService, serviceApi, applicationLocalStorageService) {
        

        //cash banner images and topcategories details.
         if (!applicationLocalStorageService.checkKey('BannerList')) {
            serviceApi.getBanners();
        }

        if (!applicationLocalStorageService.checkKey('TopCategorylist')) {
            serviceApi.getTopCategory();
       }

		$scope.keyPress = function(keyCode,text){
           if (text==undefined){
                $scope.loginError = false;
            }
        }
		$scope.fnSignAll = function(email)
		{
			$scope.email = email.toLowerCase();
			console.log($scope.email);
			  serviceApi.loginCTRL($scope.email)
			.then(function (response) {
			   if (response == '204') {
				   $scope.loginError = true;
				}
			   else {
				   $scope.userName = response;
				   console.log($scope.userName);
				   localStorage.setItem("Zipcode",response);
				   localStorage.setItem("isLogin","true");
				   $state.go('app.banner', { userName: $scope.userName });
				}
			},
			function (err) {

			});
		};
		
		$scope.fnConnectFB = function()
		{
			facebookConnectPlugin.getLoginStatus( function (response)
			{
				if (response.status === 'connected') {
				  var uid = response.authResponse.userID;
				 var accessToken = response.authResponse.accessToken;
                    applicationLocalStorageService.storeCache('token', accessToken);

				facebookConnectPlugin.login(["email"], function(response) {
					 if (response.authResponse) {
						 facebookConnectPlugin.api('/me', null,
							 function(response) {
								 
								 	applicationLocalStorageService.storeCache('username', response.name);
								 	applicationLocalStorageService.storeCache('email', response.email);
								 	applicationLocalStorageService.storeCache('gender', response.gender);
									 $state.go('facebook');
							 });

					 }
				 });
				
				} else if (response.status === 'not_authorized') {
				  
				} else {

					facebookConnectPlugin.login(["email"], function(response) {
					 if (response.authResponse) {
					 	var accessToken = response.authResponse.accessToken;
                  		  applicationLocalStorageService.storeCache('token', accessToken);
						 facebookConnectPlugin.api('/me', null,
							 function(response) {
							   
									applicationLocalStorageService.storeCache('username', response.name);
								 	applicationLocalStorageService.storeCache('email', response.email);
								 	applicationLocalStorageService.storeCache('gender', response.gender);
									 $state.go('facebook');
							 });

					 }
				 });
				}
			},
			function (error) { 
				alert("" + error) 
			});
		};
    };


})();


