/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesAuth", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create : function() {
      this._sessionId = null;
      this.element.on('join-error', $.proxy(this._onJoinError, this));
      this.element.on('authentication-error', $.proxy(this._onAuthenticationError, this));
      this.element.on('authentication-failure', $.proxy(this._onAuthenticationError, this));
    },
    
    authenticate: function () {
      this._keycloak = this._getKeycloak();
      this._keycloak.init({ onLoad: 'login-required' })
        .success((authenticated) => {
          if (authenticated) {
            this.element.trigger("authenticated");
          } else {
            this.element.trigger("authentication-failure");
          }
        })
        .error((err) => {
          console.error("Authentication failed", err);
          this.element.trigger("authentication-error");
        });
    },
    
    _onAuthenticationError: function() {
      this._clearToken();
      this.authenticate();
    },
    
    logout: function () {
      this._keycloak.logout({
        redirectUri : this.options.serverUrl
      });
      location.reload();
    },
    
    token: function () {
      return this._keycloak.token;
    },
    
    sessionId: function () {
      return this._sessionId;
    },
    
    join: function () {
      $.post(this.options.serverUrl + '/join', {
        token: this.token()
      }, $.proxy(function (data) {
        this._sessionId = data.sessionId;
        this.element.trigger("joined");
      }, this))
      .fail( $.proxy(function () {
        this.element.trigger("join-error");
      }, this));
    },
    
    _getKeycloak: function () {
      return Keycloak(this.options.serverUrl + '/keycloak.json');
    },
    
    _clearToken: function () {
      if (this._keycloak) {
        this._keycloak.clearToken()
      }
    },
    
    _onJoinError: function () {
      this._clearToken();
      this.authenticate();
    }
    
  });
  
  
}).call(this);