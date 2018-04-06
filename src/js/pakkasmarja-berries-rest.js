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
      return this._prepareRequest(this._getSignAuthenticationServicesApi())
        .then((api) => {
          return api.listSignAuthenticationServices();
        })
       .catch(this._handleError);
    },
    
    findUserContact: function () {
      const userId = this._getUserId();
      return this._prepareRequest(this._getContactsApi())
        .then((api) => {
          return api.findContact(userId);
        })
        .catch(this._handleError);
    },

    updateUserCredentials: function (password) {
      const userId = this._getUserId();
      const payload = PakkasmarjaRestClient.Credentials.constructFromObject({password: password});
      return this._prepareRequest(this._getContactsApi())
        .then((api) => {
          return api.updateContactCredentials(userId, payload);
        })
        .catch(this._handleError);
    },
    
    updateUserContact: function (data) {
      const userId = this._getUserId();
      const payload = PakkasmarjaRestClient.Contact.constructFromObject(data);
      return this._prepareRequest(this._getContactsApi())
        .then((api) => {
          return api.updateContact(userId, payload);
        })
        .catch(this._handleError);
    },
    
    createContractDocumentSignRequest: function(contractId, ssn, authService) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.createContractDocumentSignRequest(contractId, (new Date()).getFullYear(), ssn, authService, {});
        })
        .catch(this._handleError);
    },
    
    updateUserContract: function (data) {
      const payload = PakkasmarjaRestClient.Contract.constructFromObject(data);
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.updateContract(data.id, payload);
        })
        .catch(this._handleError);
    },

    listContractPrices: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContractPrices(contractId, {sortBy: 'YEAR', sortDir: 'DESC'});
        })
        .catch(this._handleError);
    },

    listDeliveryPlaces: function() {
      return this._prepareRequest(this._getDeliveryPlacesApi())
        .then((api) => {
          return api.listDeliveryPlaces();
        })
        .catch(this._handleError);
    },

    getContractDocumentPDF: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.getContractDocumentWithHttpInfo(contractId, (new Date()).getFullYear(), 'PDF').then((dataAndResponse) => {
            const res = dataAndResponse.response;
            return res.body;
          });
        })
        .catch(this._handleError);
    },
    
    getContractDocument: function(contractId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.getContractDocumentWithHttpInfo(contractId, (new Date()).getFullYear(), 'HTML').then((dataAndResponse) => {
            const res = dataAndResponse.response;
            return this._blobToString(res.body);
          });
        })
        .catch(this._handleError);
    },
    
    listContractsByCategoryAndYear: function(category, year) {
      const userId = this._getUserId();
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContracts(Object.assign({itemGroupCategory: category, year: year}));
        })
        .catch(this._handleError);
    },
    
    listUserContracts: function (data) {
      const userId = this._getUserId();
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContracts({maxResults: 100})
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
        })
        .catch(this._handleError);
    },

    listPastUserContractsByItemGroupId: function (itemGroupId) {
      return this._prepareRequest(this._getContractsApi())
        .then((api) => {
          return api.listContracts({status: 'TERMINATED', itemGroupId: itemGroupId, maxResults: 10});
        })
        .catch(this._handleError);
    },
    
    findItemGroup: function(id) {
      return this._prepareRequest(this._getItemGroupsApi())
        .then((api) => {
          return api.findItemGroup(id);
        });
    },
    
    listItemGroups: function() {
      return this._prepareRequest(this._getItemGroupsApi())
        .then((api) => {
          return api.listItemGroups();
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
    },
    
    _handleError: function(err) {
      console.error('Error communicating with rest api', err);
      new Noty({
        timeout: 5000,
        text: 'Virhe yhteydessä palvelimeen. Tarkista että tiedot on syötetty oikein ja yritä myöhemmin uudelleen.',
        type: 'error'
      }).show();
    } 
    
  });
  
  
}).call(this);
