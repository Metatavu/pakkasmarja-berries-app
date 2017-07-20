/* jshint esversion: 6 */
/* global _, Promise */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesPushNotifications", {
    
    options: {
    },
    
    _create : function() {
      window.FirebasePlugin.onNotificationOpen(function(notification) {
          console.log("Received push notification");
      }, function(error) {
          console.error(error);
      });
    },
    
    subscribeTopic: function(userId) {
      window.FirebasePlugin.subscribe(userId, function() {
        console.log("Subscribed to " + userId);
      });
      
    }
    
    
  });
  
}).call(this);