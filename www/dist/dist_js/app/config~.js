(function() {
   // "use strict";
   // Use Strict is disabled on purpose as it has issues with iOS and Safari Browser
    angular.module('healthApp.config', [])
        //.constant('url', '/rest/V2/')
        //.constant('url', 'https://app2.readypointhealth.com/app/Services/rest/V2/')
        .constant('url', 'https://qa.readypointhealth.com/app/Services/rest/V2/')
        //.constant('url', 'http://dev.readypointhealth.com/app/Services/rest/V2/')
        .constant('GA_CODE', 'UA-62239388-2')
        .constant('Messages', [{
            "Key": "SURVEY_LOADING_TOO_LONG",
            "Value": "Survey you have selected has large number of questions, and will take more time to load."
        },{
            "Key": "SURVEY_LOADING",
            "Value": "Loading..."
        },{
            "Key": "MBL_SYNCING_LOGOUT",
            "Value": "You will be logged out when syncing is complete"
        }, {
            "Key": "RELOGIN_MESSAGE",
            "Value": "There was error during Syncrhonization, you will need to re-login into application"
        }, {
            "Key": "MESSAGE_TITLE",
            "Value": "Message"
        }, {
            "Key": "INTRO_SCREEN_INFO_MESSAGE",
            "Value": "The following intro will help guide you through ReadyPoint."
        }, {
            "Key": "INTRO_SCREEN_MESSAGE",
            "Value": "Do you want to see the introduction screens for future logins?"
        }, {
            "Key": "ANS_LOCKED_MESSAGE",
            "Value": "Delete your Answer and create a new one if you would like to change your Answer."
        }, {
            "Key" : "QUEUE_PROCESSING_ERROR",
            "Value" : "Error while processing your Queue, please contact your administrator. Your data will be synced only after your Queue has been processed."
        }, {
            "Key" : "QUEUE_PROCESSING_ERROR_LOGOUT",
            "Value" : "Error processing your Queue, please contact your administrator. Your Queue will be synced next time you log into application."
        }, {
            "Key": "ANS_LOCKED_TITLE",
            "Value": "Answer Locked"
        }, {
            "Key": "API_ERROR_MESSAGE",
            "Value": "Unable to connect to servers, please ensure you are connected to Wi-Fi."
        }, {
            "Key": "API_ERROR_TITLE",
            "Value": "Connection Error"
        }, {
            "Key": "AUTO_LOGGED_OUT",
            "Value": "You have been logged out due to inactivity. Log back in."
        }, {
            "Key": "CANCEL_MESSAGE",
            "Value": "Are you sure you want to clear your changes?"
        }, {
            "Key": "CANCEL_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "SURVEY_COMPLETED_MESSAGE",
            "Value": "Survey Completed"
        }, {
            "Key": "COMPLETE_TITLE",
            "Value": "Survey Completed"
        }, {
            "Key": "DELET_NOTIF_MESSAGE",
            "Value": "Are you sure you want to delete this notification?"
        }, {
            "Key": "DELETE_ANSWER",
            "Value": "Do you want to delete the answer?"
        }, {
            "Key": "DELETE_ANS_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELETE_ATTACH_MESSAGE",
            "Value": "Are you sure you want to remove this attachment?"
        }, {
            "Key": "DELETE_ATTACH_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELETE_NOTIF_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "DELTE_NOTIFICATIONS",
            "Value": "Are you sure you want to delete all Notifications?"
        }, {
            "Key": "DRAFT_MESSAGE",
            "Value": "Draft Survey information has been saved."
        }, {
            "Key": "DRAFT_TITLE",
            "Value": "Survey Drafted"
        }, {
            "Key": "ISSUE_SAVED",
            "Value": "Finding successfully saved."
        }, {
            "Key": "ISSUE_SAVED_TITLE",
            "Value": "Finding Saved"
        }, {
            "Key": "LOGGED_OUT",
            "Value": "You have successfully Logged out"
        }, {
            "Key": "LOGIN_FAIL_TITLE",
            "Value": "Login Failed"
        }, {
            "Key": "LOGOUT_TITLE",
            "Value": "Logged Out"
        }, {
            "Key": "NAV_CONFIRM_MESSAGE",
            "Value": "Do you want to navigate to another page?"
        }, {
            "Key": "NAV_CONFIRM_TITLE",
            "Value": "Confirmation"
        }, {
            "Key": "QUEUE_PEND_OFF_MESSAGE",
            "Value": "You have saved work from an out of WI-FI session. Before logging out, please connect to WI-FI to sync your data. Your data will not be lost, but it will not appear on the web portal until syncing is complete."
        }, {
            "Key": "QUEUE_PEND_ON_MESSAGE",
            "Value": "You have saved work from an out of WI-FI session. Your data is Synchronizing."
        }, {
            "Key": "QUEUE_PEND_TITLE",
            "Value": "Queue Sync Pending"
        }, {
            "Key": "REQ_FIELDS_MESSAGE",
            "Value": "Please fill out required fields"
        }, {
            "Key": "REQ_FIELDS_TITLE",
            "Value": "Required Fields"
        }, {
            "Key": "SYNC_FAIL_MESSAGE",
            "Value": "Unable to connect to servers, please ensure you are connected to Wi-Fi"
        }, {
            "Key": "SYNC_FAIL_TITLE",
            "Value": "Sync Failed"
        }, {
            "Key": "SYNC_MAN_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_MAN_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "SYNC_NOTIF_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_NOTIF_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "SYNC_OPT_MESSAGE",
            "Value": "Do you want to reset your data? If you would like to proceed, this synchronization could take up to 2 minutes because this is a comprehensive refresh that will update the application to the database."
        }, {
            "Key": "SYNC_OPT_TITLE",
            "Value": "Synchronize"
        }, {
            "Key": "SYNC_SURVEY_OFF_MESSAGE",
            "Value": "You are currently offline, Data cannot be Synchronized"
        }, {
            "Key": "SYNC_SURVEY_OFF_TITLE",
            "Value": "Offline"
        }, {
            "Key": "INITIAL_LOADING_MESSAGE",
            "Value": "Please wait while your data is syncing. Your loading time will be longer than usual because this is your first login."
        }, {
            "Key": "SYNC_LOADING_MESSAGE",
            "Value": "Please wait while loading your data..."
        }, {
            "Key": "SUBSEQ_LOADING_MESSAGE",
            "Value": "Please wait while loading your data..."
        }, {
            "Key": "WIFI_LINKED_STND_MESSAGE",
            "Value": "Connect to Wi-Fi to view any linked Standards."
        },{
            "Key": "REVRT_MESSAGE",
            "Value": "Do you want to revert the changes?"
        }, {
            "Key": "LOGOUT_ONLINE_DATA_IN_QUEUE",
            "Value": "You have saved work that will now be updated to server."
        }])
        .constant('DB_CONFIG', {
            name: 'healthApp_8.db',
            tables: [{
                name: 'Attachment',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'attachmentId',
                    type: 'text'
                }, {
                    name: 'orgId',
                    type: 'text'
                }, {
                    name: 'surveyId',
                    type: 'text'
                }, {
                    name: 'ext',
                    type: 'text'
                }, {
                    name: 'data',
                    type: 'text'
                }, {
                    name: 'bigData',
                    type: 'text'
                }]
            }, {
                name: 'Queue',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'message',
                    type: 'text'
                }]
            }, {
                name: 'Survey',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'surveyId',
                    type: 'text'
                }, {
                    name: 'tempId',
                    type: 'text'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'checklistID',
                    type: 'integer'
                }, {
                    name: 'checklist',
                    type: 'text'
                }, {
                    name: 'locationID',
                    type: 'integer'
                }, {
                    name: 'location',
                    type: 'text'
                }, {
                    name: 'dueDate',
                    type: 'text'
                }, {
                    name: '_status',
                    type: 'text'
                }, {
                    name: 'json',
                    type: 'text'
                }]
            }, {
                name: 'OrgResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'orgId',
                    type: 'integer'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }, {
                name: 'AppResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }, {
                name: 'UserResource',
                columns: [{
                    name: 'id',
                    type: 'integer primary key'
                }, {
                    name: 'userId',
                    type: 'integer'
                }, {
                    name: 'resourceType',
                    type: 'text'
                }, {
                    name: 'resource',
                    type: 'text'
                }, {
                    name: 'timeStamp',
                    type: 'text'
                }]
            }]
        });

}());