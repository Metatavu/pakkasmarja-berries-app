/* jshint esversion: 6 */
/* global cordova, _ */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesContracts", {
    
    _create: function () {
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(this.element).on('click', '.contract-list-item', this._onContractItemClick.bind(this));                                                                                                                                                                                                                                                                                                                                                                                  
      $(this.element).on('click', '.contract-back-btn', this._onBackBtnClick.bind(this));
      $(this.element).on('click', '.accept-btn', this._onAcceptBtnClick.bind(this));
      $(this.element).on('click', '.sign-btn', this._onSignBtnClick.bind(this));
      $(this.element).on('click', '.download-contract-btn', this._onDownloadContractBtnClick.bind(this));
    },

    _onDownloadContractBtnClick: function(e) {
      e.preventDefault();
      const button = $(e.target).closest('.download-contract-btn');
      const contractId = button.attr('data-contract-id');
      $(document.body).pakkasmarjaBerriesRest('getContractDocumentPDF', contractId).then((contractDocument) => {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = contractDocument;
        a.download = "sopimus.pdf";
        a.click();
        window.URL.revokeObjectURL(contractDocument);
      });
    },

    _onSignBtnClick: function(e) {
      const contractId = $(e.target).closest('.sign-btn').attr('data-contract-id');
      const ssn = $('#ssnInput').val();
      if (!ssn) {
        bootbox.alert('Syötä henkilötunnus.');
        return;
      }

      const authService = $('#authServiceInput').val();
      if (!authService) {
        bootbox.alert('Valitse tunnistautumispalvelu.');
        return;
      }

      const acceptedTerms = $('#acceptTerms').is(':checked');
      if (!acceptedTerms) {
        bootbox.alert('Sinun tulee hyväksyä sopimusehdot ennen allekirjoitusta.');
        return;
      }
      
      $(document.body).pakkasmarjaBerriesRest('createContractDocumentSignRequest', contractId, ssn, authService).then((contractDocumentSignRequest) => {
        if (device.platform === 'browser') {
          window.open(contractDocumentSignRequest.redirectUrl); 
        } else {
          cordova.InAppBrowser.open(contractDocumentSignRequest.redirectUrl, '_self', 'location=no,hardwareback=no,zoom=no');
        }
      });
    },

    _onAcceptBtnClick: function(e) {
      const contract = JSON.parse($(e.target).closest('.accept-btn').attr('data-contract'));
      contract.proposedQuantity = $('#contractAmountInput').val();
      contract.deliveryPlaceId = $('#contractDeliveryPlaceInput').val();
      
      $(document.body).pakkasmarjaBerriesRest('updateUserContract', contract).then((contract) => {
        $(document.body).pakkasmarjaBerriesRest('getContractDocument', contract.id).then((contractDocument) => {
          $(document.body).pakkasmarjaBerriesRest('listSignAuthenticationServices').then((authServices) => {
            const content = $('<div>')
                .append(contractDocument)
                .find('.content');

            const tempData = {};
            let currentHeader = "Sopimus";
            const nodes = content.children();
            nodes.each((index, element) => {
              if($(element).is('h1,h2,h3')) {
                currentHeader = $(element).text();
              } else {
                if (typeof(tempData[currentHeader]) === 'undefined') {
                  tempData[currentHeader] = $('<div>').append($(element));
                } else {
                  tempData[currentHeader].append($(element));
                }
              }
            });

            const data = {};
            $.each(tempData, (header, element) => {
              data[header] = $(element).html();
            });

            const detailView = $('.contract-view .contract-details-content .details-container');
            const termsView = $('<div>')
              .html(pugContractTerms({authServices: authServices, contract:contract, terms: data, year: new Date().getFullYear()}))
              .addClass('contract-terms')
              .hide()
              .appendTo($('.contract-view .contract-details-content'));

            termsView.find('.btn-link').click();
            $(detailView).hide('slide', { direction: 'left' }, 200);
            $(termsView).show('slide', { direction: 'right' }, 200);
          });
        });
      });
    },

    _onBackBtnClick: function(e) {
      const listView = $('.contract-view .contract-list-view');
      const detailView = $('.contract-view .contract-detail-container');
      
      $(detailView).hide('slide', { direction: 'left' }, 200);
      $(listView).show('slide', { direction: 'right' }, 200);
    },
    
    _onContractItemClick: function(e) {
      $('.contract-view .contract-detail-container').remove();
      $(document.body).pakkasmarjaBerriesRest('listDeliveryPlaces').then((deliveryPlaces) => {
        const contract = JSON.parse($(e.target).closest('.contract-list-item').attr('data-contract'));
        const listView = $('.contract-view .contract-list-view');
        const detailView = $('<div>')
          .html(pugContractDetails({contract: contract, deliveryPlaces: deliveryPlaces}))
          .addClass('contract-detail-container')
          .hide()
          .appendTo($('.contract-view .view-content-container'));

        $(detailView).show('slide', { direction: 'right' }, 200);
        $(listView).hide('slide', { direction: 'left' }, 200);
      });
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'contracts') {
        this._loadContracts();
      }
    },
    
    _loadContracts: function () {
      $(document.body).pakkasmarjaBerriesRest('findUserContact').then((contact) => {
        
        $(document.body).pakkasmarjaBerriesRest('listUserContracts').then((contracts) => {
          const activeContracts = contracts.filter(contract => contract.status === 'APPROVED');
          const pendingContracts = contracts.filter(contract => contract.status === 'DRAFT' || contract.status === 'ON_HOLD' );
          
          activeContracts.forEach((activeContract) => {
            activeContract.contact = contact;
            if (activeContract.itemGroup.category === 'FROZEN') {
              $('.frozen-list.active-contract-list-container').append(pugActiveContractListItem({contract: activeContract}));
            } else {
              $('.fresh-list.active-contract-list-container').append(pugActiveContractListItem({contract: activeContract}));
            }
          });
          pendingContracts.forEach((pendingContract) => {
            pendingContract.contact = contact;
            if (pendingContract.itemGroup.category === 'FROZEN') {
              $('.frozen-list.pending-contract-list-container').append(pugPendingContractListItem({contract: pendingContract}));
            } else {
              $('.fresh-list.pending-contract-list-container').append(pugPendingContractListItem({contract: pendingContract}));
            }
            
          });
        }).catch((err) => {
          console.log(err);
        });
      });
    }
    
  });
})();

