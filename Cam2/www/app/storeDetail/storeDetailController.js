(function () {
    'use strict';

    angular.module('starter').controller('storeDetailController', ['$scope', '$rootScope', '$ionicActionSheet', '$state', 'serviceApi', 'applicationLocalStorageService', 'commonHelper', '$stateParams', storeDetailController]);
/*Filter for Phone number format*/
angular.module('starter').filter('phonenumber', function() {
        
        return function (number) {
          
            if (!number) { return ''; }
 
            number = String(number);
            var formattedNumber = number;
            var c = (number[0] == '1') ? '1 ' : '';
            number = number[0] == '1' ? number.slice(1) : number;
 
            var area = number.substring(0,3);
            var front = number.substring(3, 6);
            var end = number.substring(6, 10);
 
            if (front) {
                formattedNumber = (c + "(" + area + ") " + front);  
            }
            if (end) {
                formattedNumber += ("-" + end);
            }
            return formattedNumber;
        };
        });
/*Filter for Phone number format*/
    function storeDetailController($scope, $rootScope, $ionicActionSheet, $state, serviceApi, applicationLocalStorageService, commonHelper, $stateParams) {
        console.log('In stores Controller');
		
	
		$scope.getdirectionPopup = function() {	
			$ionicActionSheet.show({
			  titleText:'<div class="share-address">'+$scope.storeDetail.address.address1+ $scope.storeDetail.address.address2 + '<br>' +$scope.storeDetail.address.city+ ', ' + $scope.storeDetail.address.state + ' ' +$scope.storeDetail.address.zipCode+ '</div>',
			  buttons: [
				{ text: '<div class="email-btn"> <a onclick="app.fndirection();" class="btn btn-secondary btn-lg btn-block" href="javascript:void(0);">Get Directions</a> </div>' },
				//{ text: '<i class="icon ion-arrow-move"></i> Move' },
			  ],
			  //destructiveText: 'Delete',
			  cancelText: '<div class="share-footer">Cancel</div>',
			  cancel: function() {
				//TBD
			  },
			  buttonClicked: function(index) {
               var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
               var mapurl = '';
                var addr = '';
               if($scope.storeDetail.address.address1!="" && $scope.storeDetail.address.address2!="")
               {    
                    addr = $scope.storeDetail.address.address1+ ', ' + $scope.storeDetail.address.address2
               }
               else if($scope.storeDetail.address.address1!="" &&$scope.storeDetail.address.address2=="" )
               {
                     addr = $scope.storeDetail.address.address1;
               }
                
               if (iOS) { 
                         mapurl = "http://maps.apple.com/?daddr=" +addr+", "+$scope.storeDetail.address.city+ ', ' + $scope.storeDetail.address.state + ' ' + $scope.storeDetail.address.zipCode;
                } else {
                         mapurl = "http://maps.google.com/maps?daddr="+addr+", "+$scope.storeDetail.address.city+ ', ' + $scope.storeDetail.address.state + ' ' + $scope.storeDetail.address.zipCode;
                }
               var ref = window.open(mapurl, '_system');
				return true;
			  },
			  destructiveButtonClicked: function() {
				//console.log('DESTRUCT');
				return true;
			  }
			});
	   };

        $scope.storeId = $stateParams.storeId;
        $scope.from = $stateParams.from;
        $scope.pageNumber = 1;
        $scope.fromflag = true;

        if($scope.from=='store')
        {
        	 $scope.fromflag = true;
        }else
        {
        	$scope.fromflag = false;
        }
        $scope.changeDay = function(index) 
        {

            $scope.start_time = $scope.storeDetail.weeklyHours[index].openTime;
            $scope.close_time = $scope.storeDetail.weeklyHours[index].closeTime;
            angular.forEach($scope.storeDetail.weeklyHours, function(value,key) {

             $scope.storeDetail.weeklyHours[key].isToday = false;
              
            });
            $scope.storeDetail.weeklyHours[index].isToday=true;
        }
        if (!applicationLocalStorageService.checkKey('StoreDetail_' + $scope.storeId)) {
            serviceApi.getStoreDetail($scope.storeId)
            .then(function (response) {
                $scope.storeDetail = response;
                 
                applicationLocalStorageService.storeCache('StoreDetail_' + $scope.storeId, response);
                $scope.storeDetail.weeklyHours.unshift($scope.storeDetail.weeklyHours[6]);
                $scope.storeDetail.weeklyHours.pop();
                for(var i=0 ; i<$scope.storeDetail.weeklyHours.length;i++)
                {
                    if($scope.storeDetail.weeklyHours[i].isToday==true)
                    {     $scope.changeDay(i);
                        break;
                    }
                }
                
                
            },
            function (err) {

            });
        }
        else {
            $scope.storeDetail = applicationLocalStorageService.getCache('StoreDetail_' + $scope.storeId);
            $scope.storeDetail.weeklyHours.unshift($scope.storeDetail.weeklyHours[6]);
                $scope.storeDetail.weeklyHours.pop();
                for(var i=0 ; i<$scope.storeDetail.weeklyHours.length;i++)
                {
                    if($scope.storeDetail.weeklyHours[i].isToday==true)
                    {     $scope.changeDay(i);
                        break;
                    }
                }
        }
        
        
    }
})();