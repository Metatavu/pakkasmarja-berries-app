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
      return this._prepareRequest(this._getSignAuthenticationServicesApi()).then((api) => {
        return api.listSignAuthenticationServices();
      });
    },
    
    findUserContact: function () {
      const userId = this._getUserId();
      return this._prepareRequest(this._getContactsApi())
        .then((api) => {
          return api.findContact(userId);
        });
    },
    
    updateUserContact: function (data) {
      const userId = this._getUserId();
      const payload = PakkasmarjaRestClient.Contact.constructFromObject(data);
      return this._prepareRequest(this._getContactsApi())
        .then((api) => {
          return api.updateContact(userId, payload);
        });
    },
    
    createContractDocumentSignRequest: function(contractId, ssn, authService) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.createContractDocumentSignRequest(contractId, (new Date()).getFullYear(), ssn, authService, {});
        });
    },
    
    updateUserContract: function (data) {
      const payload = PakkasmarjaRestClient.Contract.constructFromObject(data);
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.updateContract(data.id, payload);
        });
    },

    listContractPrices: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContractPrices(contractId, {sortBy: 'YEAR', sortDir: 'DESC'});
        });
    },

    listDeliveryPlaces: function() {
      return this._prepareRequest(this._getDeliveryPlacesApi())
        .then((api) => {
          return api.listDeliveryPlaces();
        });
    },

    getContractDocumentPDF: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.getContractDocumentWithHttpInfo(contractId, (new Date()).getFullYear(), 'PDF').then((dataAndResponse) => {
            const res = dataAndResponse.response;
            return res.body;
          });
        });
    },
    
    getContractDocument: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.getContractDocumentWithHttpInfo(contractId, (new Date()).getFullYear(), 'HTML').then((dataAndResponse) => {
            const res = dataAndResponse.response;
            return this._blobToString(res.body);
          });
        });
    },
    
    listUserContracts: function (data) {
      const userId = this._getUserId();
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContracts()
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
        });
    },
    
    findItemGroup: function(id) {
      return this._prepareRequest(this._getItemGroupsApi())
        .then((api) => {
          return api.findItemGroup(id);
        });
    },

    _getDeliveryPlacesApi: function() {
      return new PakkasmarjaRestClient.DeliveryPlacesApi();
    },
    
    _getContractsApi: function() {
      return new PakkasmarjaRestClient.ContractsApi();
    },
    
    _getContactsApi: function() {
      return new PakkasmarjaRestClient.ContactsApi();
    },
    
    _getSignAuthenticationServicesApi: function() {
      return new PakkasmarjaRestClient.SignAuthenticationServicesApi();
    },
    
    _getItemGroupsApi: function() {
      return new PakkasmarjaRestClient.ItemGroupsApi();
    },
    
    _getUserId: function() {
      return $(document.body).pakkasmarjaBerriesAuth('getUserId');
    },
    
    _prepareRequest: function(api) {
      return new Promise((resolve, reject) => {
        this._getAccessToken()
          .then((accessToken) => {
            PakkasmarjaRestClient.ApiClient.instance.authentications.bearer.apiKey = accessToken;
            resolve(api);
        });
      });
    },
    
    _getAccessToken: function () {
      return $(document.body).pakkasmarjaBerriesAuth('token')
        .then((token) => {
          return `Bearer ${token}`;
        });
    },
    
    _blobToString: function(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function() {
          resolve(reader.result);
        };
        reader.readAsText(blob);
      });
    }
    
  });
  
  
}).call(this);
