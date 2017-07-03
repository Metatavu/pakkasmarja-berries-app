/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesClient", {
    
    options: {
      serverUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000',
      reconnectTimeout: 3000,
      logDebug: false
    },
    
    _create : function() {
      this._state = null;
      this._pendingMessages = [];
    },
    
    connect: function (sessionId) {
      if (this.options.logDebug) {
        console.log("Connecting...");
      }
      
      this._state = 'CONNECTING';
      
      this._webSocket = this._createWebSocket(sessionId);
      if (!this._webSocket) {
        return;
      } 
      
      switch (this._webSocket.readyState) {
        case this._webSocket.CONNECTING:
          this._webSocket.onopen = $.proxy(this._onWebSocketOpen, this);
        break;
        case this._webSocket.OPEN:
          this._onWebSocketOpen();
        break;
        default:
          this._reconnect();
        break;
      }
      
      this._webSocket.onmessage = $.proxy(this._onWebSocketMessage, this);
      this._webSocket.onclose = $.proxy(this._onWebSocketClose, this);
      this._webSocket.onerror = $.proxy(this._onWebSocketError, this);
    },
    
    sendMessage: function (data) {
      this._sendMessage(data);
    },
    
    _reconnect: function () {
      if (this.options.logDebug) {
        console.log("Reconnecting...");
      }
    
      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }
      
      if (!this._webSocket || this._webSocket.readyState !== this._webSocket.CONNECTING) {
        this.connect();
      }
      
      this._reconnectTimeout = setTimeout($.proxy(function () {
        if (this.options.logDebug) {
          console.log("timeout socket state: " + this._webSocket.readyState);
        }
        
        this.element.pakkasmarjaBerriesAuth('join');
        
        if (this._webSocket.readyState === this._webSocket.CLOSED) {
          this._reconnect();
        }
      }, this), this.options.reconnectTimeout);
    },

    _createWebSocket: function (sessionId) {
      const url = this.options.wsUrl + '/' + sessionId;
      if ((typeof window.WebSocket) !== 'undefined') {
        return new WebSocket(url);
      } else if ((typeof window.MozWebSocket) !== 'undefined') {
        return new MozWebSocket(url);
      }
    },
    
    _sendMessage: function (data) {
      const message = JSON.stringify(data);
      
      if (this._state === 'CONNECTED') {
        this._webSocket.send(message);
      } else {
        this._pendingMessages.push(message);
      }
    },
    
    _onWebSocketOpen: function (event) {
      while (this._pendingMessages.length) {
        this._webSocket.send(this._pendingMessages.shift());
      }
      
      this._state = 'CONNECTED';
      
      this.element.trigger("connect", { }); 
      if (this.options.logDebug) {
        console.log("Connected");
      }
    },
    
    _onWebSocketMessage: function (event) {
      const message = JSON.parse(event.data);
      this.element.trigger("message:" + message.type, message.data); 
    },
    
    _onWebSocketClose: function (event) {
      if (this.options.logDebug) {
        console.log("Socket closed");
      }
      console.log("Ws closed... client 120");
      this._reconnect();
    },
    
    _onWebSocketError: function (event) {
      if (this.options.logDebug) {
        console.log("Socket error");
      }
      console.log("Reconnecting... client 128");
      this._reconnect();
    }
    
  });
  
  
}).call(this);