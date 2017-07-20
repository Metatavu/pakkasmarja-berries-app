/* jshint esversion: 6 */
/* global _, Promise */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesPushNotifications", {
    
    options: {
    },
    
    _create : function() {
    },
    
    subscribeTopic: function(userId) {
      window.FirebasePlugin.subscribe(userId, function() {
        console.log("Subscribed to " + userId);
      });
      
    }
    
    
  });
  
}).call(this);