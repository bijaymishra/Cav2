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