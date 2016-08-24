(function () {

    'use strict';

    var config_module = angular.module('starter.config', []);

    var config_data = {
        'GENERAL_CONFIG': {

            'APP_KEY': '23B5D06B-DC43-42A4-84E2-61A531736155', // staging
            //'APP_KEY': 'ZkXexCe3xuBcmGUrtxAQW26k4fToOhMZ', // production

            'APP_NAME': 'Cash America',
            'APP_VERSION': '2.0.0',
            'API_VERSION': '2',
            'GA_enabled' : false,
            'API_USING': 'Staging',
            'API_URL1': 'https://mobileapps-stg.cashamerica.com/api/V1/',
            'API_URL': 'https://mobileapps-stg.cashamerica.com/api/V2/',// staging url
            //'API_URL': 'https://mobileapps.cashamerica.com/api/V2/',// production url
            'DEFAULT_USERNAME': 'Satish.Kumar',  // Will remove in production release. 

            'DEFAULT_UUID': '3DDC0D0E-1B4A-421C-95CE-5A3A0F276A38', // My iphone 4 UUID for testing. 
            'GEO_CODE_URL': 'https://maps.googleapis.com/maps/api/geocode/json?address=',
            'SearchPriceHigh' : '99999.00',
            'SearchPriceLow' : '0.0',
            'SearchDistance' : '5000',
            'name': 'database'/*+Math.floor(Math.random()*10)*/,
            'tables': [
               {
                   name: 'items',
                   columns: [
                   { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
                   { name: 'itemName', type: 'text' },
                   { name: 'longICN', type: 'text' },
                   { name: 'details', type: 'text' },
                   { name: 'price', type: 'integer' },
                   { name: 'distance', type: 'text' },
                   { name: 'storeNumber', type: 'text' },
                   { name: 'shortName', type: 'text' },
                   { name: 'favorite', type: 'text' },
                   { name: 'isAvailable', type: 'text' },
                   { name: 'categoryCode', type: 'integer' }
                   
                   ]
               },
               {
                   name: 'stores',
                   columns: [
                   { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
                   { name: 'brand', type: 'text' },
                   { name: 'address1', type: 'text' },
                   { name: 'address2', type: 'text' },
                   { name: 'state', type: 'text' },
                   { name: 'city', type: 'text' },
                   { name: 'zipCode', type: 'integer' },
                   { name: 'distance', type: 'text' },
                   { name: 'latitude', type: 'text' },
                   { name: 'longitude', type: 'text' },
                   { name: 'storeNumber', type: 'text' },
                   { name: 'shortName', type: 'text' },
                   { name: 'favorite', type: 'text' }

                   ]
               },
               {
                   name: 'generic',
                   columns: [{ name: 'key', type: 'text' },
                            { name: 'value', type: 'text' }]
               }
            ],
            'STATES': [
           { "name": "State", "abbreviation": "" },
           { "name": "Alabama", "abbreviation": "AL" },
           { "name": "Alaska", "abbreviation": "AK" },
           { "name": "Arizona", "abbreviation": "AZ" },
           { "name": "Arkansas", "abbreviation": "AR" },
           { "name": "California", "abbreviation": "CA" },
           { "name": "Colorado", "abbreviation": "CO" },
           { "name": "Connecticut", "abbreviation": "CT" },
           { "name": "Delaware", "abbreviation": "DE" },
           { "name": "District Of Columbia", "abbreviation": "DC" },
           { "name": "Florida", "abbreviation": "FL" },
           { "name": "Georgia", "abbreviation": "GA" },
           { "name": "Hawaii", "abbreviation": "HI" },
           { "name": "Idaho", "abbreviation": "ID" },
           { "name": "Illinois", "abbreviation": "IL" },
           { "name": "Indiana", "abbreviation": "IN" },
           { "name": "Iowa", "abbreviation": "IA" },
           { "name": "Kansas", "abbreviation": "KS" },
           { "name": "Kentucky", "abbreviation": "KY" },
           { "name": "Louisiana", "abbreviation": "LA" },
           { "name": "Maine", "abbreviation": "ME" },
           { "name": "Maryland", "abbreviation": "MD" },
           { "name": "Massachusetts", "abbreviation": "MA" },
           { "name": "Michigan", "abbreviation": "MI" },
           { "name": "Minnesota", "abbreviation": "MN" },
           { "name": "Mississippi", "abbreviation": "MS" },
           { "name": "Missouri", "abbreviation": "MO" },
           { "name": "Montana", "abbreviation": "MT" },
           { "name": "Nebraska", "abbreviation": "NE" },
           { "name": "Nevada", "abbreviation": "NV" },
           { "name": "New Hampshire", "abbreviation": "NH" },
           { "name": "New Jersey", "abbreviation": "NJ" },
           { "name": "New Mexico", "abbreviation": "NM" },
           { "name": "New York", "abbreviation": "NY" },
           { "name": "North Carolina", "abbreviation": "NC" },
           { "name": "North Dakota", "abbreviation": "ND" },
           { "name": "Ohio", "abbreviation": "OH" },
           { "name": "Oklahoma", "abbreviation": "OK" },
           { "name": "Oregon", "abbreviation": "OR" },
           { "name": "Pennsylvania", "abbreviation": "PA" },
           { "name": "Puerto Rico", "abbreviation": "PR" },
           { "name": "Rhode Island", "abbreviation": "RI" },
           { "name": "South Carolina", "abbreviation": "SC" },
           { "name": "South Dakota", "abbreviation": "SD" },
           { "name": "Tennessee", "abbreviation": "TN" },
           { "name": "Texas", "abbreviation": "TX" },
           { "name": "Utah", "abbreviation": "UT" },
           { "name": "Vermont", "abbreviation": "VT" },
           { "name": "Virginia", "abbreviation": "VA" },
           { "name": "Washington", "abbreviation": "WA" },
           { "name": "West Virginia", "abbreviation": "WV" },
           { "name": "Wisconsin", "abbreviation": "WI" },
           { "name": "Wyoming", "abbreviation": "WY" }],
           'SCREEN_NAME' : {
            "banner" : "Home",
            "stores" : "StoreSearch" ,           
            "storeDetail":"StoreDetails",
            "inventory":"InventoryBrowse",
            "inventoryItem":"InventoryBrowseLevel2",
            "itemList":"InventorySearch",
            "saveitems":"Saved Items",
            "promotions":"OfferList",
            "promotionDetail":"OfferDetail",
            "privacy":"PrivacyNotice"
              },
            'S3_Models' : ["GT-I9300",
                           "GT-I9305",
                           "SHV-E210K",
                           "SHV-E210L",
                           "SHV-E210S",
                           "SGH-T999",
                           "SGH-T999V",
                           "SGH-I747",
                           "SGH-N064",
                           "SGH-N035",
                           "SCH-J021",
                           "SCH-R530",
                           "SCH-I535",
                           "SCH-S960L",
                           "SCH-S968C",
                           "GT-I9308",
                           "SCH-I939",
                           "GT-I9301I",
                           "SAMSUNG-SGH-I747"]
        }
    }
    angular.forEach(config_data, function (key, value) {
        config_module.constant(value, key);
    });
})();

