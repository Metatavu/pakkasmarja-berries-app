/* jshint esversion: 6 */
/* global FCMPlugin, device */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesPlatformSettings", {
    
    options: {
      logDebug: false
    },
    
    _create : function() {
      this.platform = device.platform.toLowerCase();
      
      if (this.platform === 'ios') {
        $(".navbar-top").css({
          'top': '27px'
        });
        $(".secondary-menu").css({
          'margin-top': '60px'
        });
        $(".chat-container").css({
          'top': '27px'
        });
        $(".news-wrapper").css({
          'top': '27px'
        });
        $(".message-input").css({
          'width': '63vw'
        });
      } else {
        // Android settings
      }
    }
  });
  
}).call(this);