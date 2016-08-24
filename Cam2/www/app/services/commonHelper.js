(function () {
    'use strict';

    angular.module('starter').factory('commonHelper', ['$cordovaDevice', 'GENERAL_CONFIG', commonHelper]);

    function commonHelper($cordovaDevice, GENERAL_CONFIG) {

        // Get empty chart config 
        // 
        function getEmptyChartConfig() {

            var emptyChartConfig = { options: { chart: { height: 275, }, credits: { enabled: false }, title: { text: "" } } };

            return emptyChartConfig;
        };

        // Function to combine data and chart config
        // @ConfigObject
        // @configData
        function getChart(config, data) {

            // Set config
            var configObject = angular.fromJson(config);

            // Set Data 
            var configData = angular.fromJson(data);


            // loop data to xAxisName Name
            var xAxisName = configObject.xAxis.categories;
            angular.forEach(configData, function (value, key) {

                if (key.toUpperCase() == xAxisName.toUpperCase()) {
                    configObject.xAxis.categories = value;
                };
            });

            // loop for series data setting
            var seriesData = configObject.series;

            angular.forEach(seriesData, function (yvalue, ykey) {
                var yAxisName = yvalue.data;

                angular.forEach(configData, function (cvalue, ckey) {
                    if (ckey.toUpperCase() == yAxisName.toUpperCase()) {

                        yvalue.data = cvalue;

                        // legend total here. 
                        var total = 0;
                        angular.forEach(cvalue, function (v, k) {
                            total += v;
                        });

                        if (total > 0) {
                            yvalue.name = yvalue.name + ' ' + total;
                        }
                    };

                });
            });

            return configObject;
        };

        // Get pie chart. 
        // @configObject 
        // @configData
        function getPie(config, data) {

            // Set config
            var configObject = angular.fromJson(config);

            // Set Data 
            var configData = angular.fromJson(data);

            // Loop the data.
            angular.forEach(configData, function (value, key) {

                var firstColumn = 1;
                var counter = 0;

                angular.forEach(value, function (cvalue, ckey) {

                    var dataArray = [];

                    if (null == configObject.series[0].data[counter]) {
                        dataArray = [cvalue];

                        configObject.series[0].data.push(dataArray);
                    }
                    else {
                        dataArray = configObject.series[0].data[counter];

                        dataArray.push(cvalue);
                    };

                    counter++;
                });

                firstColumn = 2;
            });

            return configObject;

        };  // end of PIE

        function getCollection(config, data) {

            // Set config
            var configObject = [];

            // Set Data 
            var configData = angular.fromJson(data);

            // Loop the data.
            angular.forEach(configData, function (value, key) {

                var firstColumn = 1;
                var counter = 0;

                angular.forEach(value, function (cvalue, ckey) {

                    var dataArray = [];

                    if (null == configObject[counter]) {
                        dataArray = [cvalue];

                        configObject.push(dataArray);
                    }
                    else {
                        dataArray = configObject[counter];

                        dataArray.push(cvalue);

                        // logic to set class and icon
                        if (angular.isNumber(cvalue)) {

                            var cssClass = 'energized';
                            var icon = 'icon ion-ios7-minus-empty'

                            if (cvalue == 0) {
                                cssClass = 'energized';
                                icon = 'icon ion-ios7-minus-empty'
                            }
                            else if (cvalue > 0) {

                                cssClass = 'balanced';
                                icon = 'icon ion-arrow-up-c'

                            }
                            else if (cvalue < 0) {

                                cssClass = 'assertive';
                                icon = 'icon ion-arrow-down-c'

                            };

                            dataArray.push(cssClass);
                            dataArray.push(icon);

                        };


                    };

                    counter++;
                });

                firstColumn = 2;
            });

            return configObject;

        };  // end of PIE

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
                    uuid: GENERAL_CONFIG.DEFAULT_UUID,
                    deviceinfo: 'Machine',
                    platform: 'MS',
                };
            }

            return deviceInfomation;
        }


        // Public method expose for outside. 
        return {
            getChart: getChart,
            getPie: getPie,
            getCollection: getCollection,
            getEmptyChartConfig: getEmptyChartConfig,
            getDeviceInformation: getDeviceInformation
        };
    };

})();



