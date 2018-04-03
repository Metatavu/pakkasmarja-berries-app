/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesAuth", {
    
    options: {
      serverUrl: 'http://localhost:8000',
      minTokenValidity: 5
    },
    
    _create : function() {
      if (cordova.InAppBrowser && device.platform !== 'browser') {
        window.open = (url, target, options) => {
          return cordova.InAppBrowser.open(url, target, options + ',zoom=no');
        };
      }
    
      this._sessionId = null;
      this.element.on('join-error', $.proxy(this._onJoinError, this));
      this.element.on('authentication-error', $.proxy(this._onAuthenticationError, this));
      this.element.on('authentication-failure', $.proxy(this._onAuthenticationError, this));
    },
    
    authenticate: function () {
      this._keycloak = this._getKeycloak();
      const initOptions = {
        onLoad: 'login-required'
      };
      
      if ('browser' === device.platform) {
        initOptions.adapter = 'default';
      }
      
      this._keycloak.init(initOptions)
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
      if ('browser' === device.platform) {
        this._keycloak.logout();
      } else {
        $.ajax({
          url: this._keycloak.createLogoutUrl(),
          complete: () => {
            window.FirebasePlugin.unregister();
            this._clearToken();
            location.reload();
          }
        });
      }
    },
    
    token: function () {
      return new Promise((resolve, reject) => {
        this._keycloak.updateToken(this.options.minTokenValidity).success(() => {
          resolve(this._keycloak.token);
        }).error(() => {
          reject();
        });
      });
    },
    
    sessionId: function () {
      return this._sessionId;
    },
    
    getUserId: function () {
      return this.userId;
    },

    getAccountUrl: function (userId) {
      if (this._keycloak) {
        return this._keycloak.createAccountUrl();
      }
      
      return null;
    },
    
    join: function () {
      this.token().then((accessToken) => {
        $.post(this.options.serverUrl + '/join', {
          token: accessToken
        }, $.proxy(function (data) {
          this._sessionId = data.sessionId;
          this.userId = data.userId;
          $(document.body).pakkasmarjaBerriesPushNotifications('subscribeTopic', data.userId);
          this.element.trigger("joined");
        }, this))
        .fail( $.proxy(function () {
          this.element.trigger("join-error");
        }, this));
      });
    },
    
    isAppManager: function() {
      if (this._keycloak) {
        return this._keycloak.hasRealmRole('app-manager');
      }
      
      return false;
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
