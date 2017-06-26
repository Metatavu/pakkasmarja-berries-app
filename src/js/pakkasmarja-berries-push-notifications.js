/* jshint esversion: 6 */
/* global FCMPlugin */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesPushNotifications", {
    
    options: {
      logDebug: false
    },
    
    _create : function() {
      FCMPlugin.subscribeToTopic('news', $.proxy(this._onNewsSubscribeSuccess, this), $.proxy(this._onNewsSubscribeFailure, this));
    },
    
    _onNewsSubscribeSuccess: function (message) {
      if (this.options.logDebug) {
        console.log("Subscribed to topic news succesfully", message);
      }
    },
    
    _onNewsSubscribeFailure: function (err) {
      if (this.options.logDebug) {
        console.error("Could not subscribe to topic news", err);
      }
    }
    
  });
  
}).call(this);