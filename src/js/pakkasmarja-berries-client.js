/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesClient", {
    
    options: {
      serverUrl: 'http://localhost:8000',
      wsUrl: 'ws://localhost:8000',
      reconnectTimeout: 3000
    },
    
    _create : function() {
      this._state = null;
      this._pendingMessages = [];
      this._queryId = null;
    },
    
    connect: function (sessionId) {
      alert("Yhdistetään...");
      this._state = 'CONNECTING';
      
      this._webSocket = this._createWebSocket(sessionId);
      if (!this._webSocket) {
        alert("Client !this._webSocket");
        return;
      } 
      
      switch (this._webSocket.readyState) {
        case this._webSocket.CONNECTING:
          alert("case this._webSocket.CONNECTING");
          this._webSocket.onopen = $.proxy(this._onWebSocketOpen, this);
        break;
        case this._webSocket.OPEN:
          alert("case this._webSocket.OPEN");
          this._onWebSocketOpen();
        break;
        default:
          alert("case default");
          this._reconnect();
        break;
      }
      
      this._webSocket.onmessage = $.proxy(this._onWebSocketMessage, this);
      this._webSocket.onclose = $.proxy(this._onWebSocketClose, this);
      this._webSocket.onerror = $.proxy(this._onWebSocketError, this);
    },
    
    sendMessage: function (data) {
      alert("Client sendMessage");
      this._sendMessage(data);
    },
    
    _reconnect: function () {
      alert("Client _reconnect");
      console.log("Reconnecting...");
      
      if (this._reconnectTimeout) {
        clearTimeout(this._reconnectTimeout);
      }
      
      if (!this._webSocket || this._webSocket.readyState !== this._webSocket.CONNECTING) {
        this.connect();
      }
      
      this._reconnectTimeout = setTimeout($.proxy(function () {
        console.log("timeout socket state: " + this._webSocket.readyState);
        
        this.element.pakkasmarjaBerriesAuth('join');
        
        if (this._webSocket.readyState === this._webSocket.CLOSED) {
          this._reconnect();
        }
      }, this), this.options.reconnectTimeout);
    },

    _createWebSocket: function (sessionId) {
      alert("Client _createWebSocket, sessionId: " + sessionId);
      const url = this.options.wsUrl + '/' + sessionId;
      if ((typeof window.WebSocket) !== 'undefined') {
        return new WebSocket(url);
      } else if ((typeof window.MozWebSocket) !== 'undefined') {
        return new MozWebSocket(url);
      }
    },
    
    _sendMessage: function (data) {
      alert("Client _sendMessage");
      const message = JSON.stringify(data);
      
      if (this._state === 'CONNECTED') {
        this._webSocket.send(message);
      } else {
        this._pendingMessages.push(message);
      }
    },
    
    _onWebSocketOpen: function (event) {
      alert("Client _onWebSocketOpen");
      while (this._pendingMessages.length) {
        this._webSocket.send(this._pendingMessages.shift());
      }
      
      this._state = 'CONNECTED';
      
      this.element.trigger("connect", { }); 
      
      console.log("Connected");
    },
    
    _onWebSocketMessage: function (event) {
      alert("Client _onWebSocketMessage");
      const message = JSON.parse(event.data);
      this.element.trigger("message:" + message.type, message.data); 
    },
    
    _onWebSocketClose: function (event) {
      console.log("Socket closed");
      this._reconnect();
    },
    
    _onWebSocketError: function (event) {
      console.log("Socket error");
      this._reconnect();
    }
    
  });
  
  
}).call(this);