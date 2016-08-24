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

