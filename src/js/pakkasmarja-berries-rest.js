/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _, PakkasmarjaRestClient*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesRest", {
    
    options: {
      basePath: 'http://localhost:3002/rest/v1'
    },
    
    _create : function() {
      PakkasmarjaRestClient.ApiClient.instance.basePath = this.options.basePath;
    },
    
    findUserContact: function () {
      const userId = this._getUserId();
      return this._getContactsApi().findContact(userId);
    },
    
    updateUserContact: function (data) {
      const userId = this._getUserId();
      const payload = PakkasmarjaRestClient.Contact.constructFromObject(data);
      return this._getContactsApi().updateContact(userId, payload);
    },
    
    _getContactsApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.ContactsApi();
    },
    
    _getUserId: function() {
      return $(document.body).pakkasmarjaBerriesAuth('getUserId');
    },
    
    _setApiKey: function() {
      PakkasmarjaRestClient.ApiClient.instance.authentications.bearer.apiKey = this._getAccessToken();
    },
    
    _getAccessToken: function () {
      const token = $(document.body).pakkasmarjaBerriesAuth('token');
      return `Bearer ${token}`;
    }
    
  });
  
  
}).call(this);
