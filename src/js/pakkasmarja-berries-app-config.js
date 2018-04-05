/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesAppConfig", {
    
    options: {
      serverUrl: 'http://localhost:8000',
      config: {}
    },
    
    _create : function() {
      this.loadConfig();
    },
    
    loadConfig: function() {
      $.getJSON(`${this.options.serverUrl}/app-config.json`, (res) => {
        this.options.config = res;
      });
    },
    
    get: function (key) {
      return this.options.config[key];
    }
    
  });
  
  
}).call(this);
