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
    
    listSignAuthenticationServices: function() {
      return this._getSignAuthenticationServicesApi().listSignAuthenticationServices();
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
    
    createContractDocumentSignRequest: function(contractId, ssn, authService) {
      return this._getContractsApi().createContractDocumentSignRequest(contractId, new Date().getFullYear(), ssn, authService, {});
    },
    
    updateUserContract: function (data) {
      const payload = PakkasmarjaRestClient.Contract.constructFromObject(data);
      return this._getContractsApi().updateContract(data.id, payload);
    },
    
    listDeliveryPlaces: function() {
      return this._getDeliveryPlacesApi().listDeliveryPlaces();
    },
    
    getContractDocumentPDF: function(contractId) {
      return this._getContractsApi().getContractDocumentWithHttpInfo(contractId, new Date().getFullYear(), 'PDF').then((dataAndResponse) => {
        const res = dataAndResponse.response;
        return window.URL.createObjectURL(res.body);
      });
    },
    
    getContractDocument: function(contractId) {
      return this._getContractsApi().getContractDocumentWithHttpInfo(contractId, new Date().getFullYear(), 'HTML').then((dataAndResponse) => {
        const res = dataAndResponse.response;
        return this._blobToString(res.body);
      });
    },
    
    listUserContracts: function (data) {
      const userId = this._getUserId();
      return this._getContractsApi().listContracts()
        .then((contracts) => {
          const itemGroupPromises = [];
          contracts.forEach((contract) => {
            itemGroupPromises.push(this.findItemGroup(contract.itemGroupId));
          });
          return Promise.all(itemGroupPromises).then((itemGroups) => {
            itemGroups.forEach((itemGroup, index) => {
              contracts[index].itemGroup = itemGroup;
            });

            return contracts;
          });
        });
    },
    
    findItemGroup: function(id) {
      return this._getItemGroupsApi().findItemGroup(id);
    },

    _getDeliveryPlacesApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.DeliveryPlacesApi();
    },
    
    _getContractsApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.ContractsApi();
    },
    
    _getContactsApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.ContactsApi();
    },
    
    _getSignAuthenticationServicesApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.SignAuthenticationServicesApi();
    },
    
    _getItemGroupsApi: function() {
      this._setApiKey();
      return new PakkasmarjaRestClient.ItemGroupsApi();
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
    },
    
    _blobToString: function(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
            resolve(reader.result);
        }
        reader.readAsText(blob);
      });
    }
    
  });
  
  
}).call(this);
