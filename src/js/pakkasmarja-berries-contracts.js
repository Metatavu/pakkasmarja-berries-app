/* jshint esversion: 6 */
/* global cordova, _ */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesContracts", {
    
    _create: function () {
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(this.element).on('click', '.pending-contract-list-item', this._onContractItemClick.bind(this));                                                                                                                                                                                                                                                                                                                                                                                  
      $(this.element).on('click', '.contract-back-btn', this._onBackBtnClick.bind(this));
      $(this.element).on('click', '.sign-back-btn', this._onBackToDetailsClick.bind(this));
      $(this.element).on('click', '.accept-btn', this._onAcceptBtnClick.bind(this));
      $(this.element).on('click', '.sign-btn', this._onSignBtnClick.bind(this));
      $(this.element).on('click', '.download-contract-btn', this._onDownloadContractBtnClick.bind(this));
      $(this.element).on('click', '.past-prices-btn', this._onPastPricesBtnClick.bind(this));
      $(this.element).on('click', '.past-contracts-btn', this._onPastContractsBtnClick.bind(this));
      $(this.element).on('click', '.deny-btn', this._onDenyBtnClick.bind(this));
      $(this.element).on('keyup', '#contractAmountInput', this._onContractQuantityOrDeliveryPlaceChange.bind(this));
      $(this.element).on('change', '#contractDeliveryPlaceInput', this._onContractQuantityOrDeliveryPlaceChange.bind(this));
    },

    _onDenyBtnClick: function(e) {
      bootbox.prompt({
        title: "Haluatko varmasti hylätä sopimuksen? Kirjoita perustelu alle.",
        inputType: 'textarea',
        buttons: {
            confirm: {
                label: 'Hylkää sopimus',
                className: 'btn-danger'
            },
            cancel: {
                label: 'Peruuta',
                className: 'btn-info'
            }
        },
        callback: (result) => {
          if (result) {
            const contract = JSON.parse($(e.target).closest('.deny-btn').attr('data-contract'));
            contract.status = 'REJECTED';
            contract.rejectComment = result;
            $(document.body).pakkasmarjaBerriesRest('updateUserContract', contract).then((updatedContract) => {
              this.openListView();
            });
          }
        }
      });
    },

    _onPastPricesBtnClick: function(e) {
      const pastPrices = JSON.parse($(e.target).closest('.past-prices-btn').attr('data-past-prices'));
      bootbox.dialog({
        size: 'large',
        message:  pugPastPricesModal({pastPrices: pastPrices})
      });
    },

    _onPastContractsBtnClick: function(e) {
      const pastContracts = JSON.parse($(e.target).closest('.past-contracts-btn').attr('data-past-contracts'));
      bootbox.dialog({
        size: 'large',
        message:  pugPastContractsModal({pastContracts: pastContracts})
      });
    },

    _onContractQuantityOrDeliveryPlaceChange: function(e) {
      const currentQuantity = $("#contractAmountInput").val();
      const contractQuantity = $("#contractAmountInput").attr('data-contract-quantity');
      const currentDeliveryPlaceId = $("#contractDeliveryPlaceInput").val();
      const contractDeliveryPlaceId = $("#contractDeliveryPlaceInput").attr('data-contract-delivery-place-id');
      
      if (currentQuantity != contractQuantity || currentDeliveryPlaceId != contractDeliveryPlaceId) {
        $('.accept-btn').text('EHDOTA MUUTOSTA');
      } else {
        $('.accept-btn').text('HYVÄKSYN');
      }
    },

    _onDownloadContractBtnClick: function(e) {
      e.preventDefault();
      const button = $(e.target).closest('.download-contract-btn');
      const contractId = button.attr('data-contract-id');
      const loader = $('<i>')
        .addClass('fa fa-spinner fa-spin')
        .appendTo(button);
      $(document.body).pakkasmarjaBerriesRest('getContractDocumentPDF', contractId).then((contractDocument) => {
        if (device.platform === 'browser') {
          const reader = new FileReader();
          reader.onload = function() {
            loader.remove();
            const link = $('<a>')
              .css('display', 'none')
              .appendTo('body');

            link[0].href = reader.result;
            link[0].download = "sopimus.pdf";
            link[0].click();
          };
          reader.readAsDataURL(contractDocument);
        } else {
          const filename = `${new Date().getTime()}.pdf`;
          window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dir) => {
            dir.getFile(filename, { create:true }, (file) => {
              file.createWriter((fileWriter) => {
                fileWriter.write(contractDocument);
                cordova.plugins.fileOpener2.open(`${cordova.file.dataDirectory}/${filename}`, 'application/pdf', {
                  error : (e) => { 
                    console.log('Error status: ' + e.status + ' - Error message: ' + e.message);
                  },
                  success :() => {
                    loader.remove();
                  }
                });
              }, () => {
                alert("Virhe pdf:än tallennuksessa.");
              });
            });
          });
        }
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
          const ref = cordova.InAppBrowser.open(contractDocumentSignRequest.redirectUrl, '_blank', 'location=no,hardwareback=no,zoom=no');
          ref.addEventListener('loadstop', (loadStopEvent) => {
            if (loadStopEvent.url.indexOf('/signcallback') > 0) {
              setTimeout(() => {
                ref.close();
                this.openListView();
              }, 3000);
            }
          });
        }
      });
    },

    _onAcceptBtnClick: function(e) {
      const contract = JSON.parse($(e.target).closest('.accept-btn').attr('data-contract'));
      contract.proposedQuantity = $('#contractAmountInput').val();
      contract.proposedDeliveryPlaceId = $('#contractDeliveryPlaceInput').val();
      contract.quantityComment = $('#contractQuantityCommentInput').val();
      contract.deliveryPlaceComment = $('#contractDeliveryPlaceCommentInput').val();
      if (contract.proposedQuantity != contract.contractQuantity || contract.proposedDeliveryPlaceId != contract.deliveryPlaceId) {
        contract.status = 'ON_HOLD';
      }
      
      $(document.body).pakkasmarjaBerriesRest('updateUserContract', contract).then((updatedContract) => {
        
        if (updatedContract.status === 'DRAFT') {
          $(document.body).pakkasmarjaBerriesRest('listSignAuthenticationServices').then((authServices) => {
            const detailView = device.platform === 'browser' ? $('.contract-view-details-container .contract-details-content .details-container') : $('.contract-view .contract-details-content .details-container');
            const termsView = $('<div>')
              .html(pugContractTerms({authServices: authServices, contract:contract, year: (new Date()).getFullYear()}))
              .addClass('contract-terms')
              .hide()
              .appendTo(device.platform === 'browser' ? $('.contract-view-details-container .contract-details-content') : $('.contract-view .contract-details-content'));

            $(detailView).hide('slide', { direction: 'left' }, 200);
            $(termsView).show('slide', { direction: 'right' }, 200, () => {
              this._updateProgressIndicator(2);
            });
          });
        } else {
          this.openListView();
        }
      });
    },

    _onBackBtnClick: function(e) {
      this.openListView();
    },
    
    _onBackToDetailsClick: function(e) {
      this._updateProgressIndicator(1);
      this.openContractDetailsView();
    },
    
    _onContractItemClick: function(e) {
      $('.contract-view .contract-detail-container').remove();
      const contract = JSON.parse($(e.target).closest('.contract-list-item').attr('data-contract'));
      if (contract.status === 'ON_HOLD') {
        bootbox.alert('Tämä sopimus odottaa, että Pakkasmarja tarkistaa annetun ehdotuksen.');
        return;
      }
      if (contract.status === 'REJECTED') {
        bootbox.alert('Olet hylännyt tämän sopimuksen. Jos näin ei pitäisi olla, ota yhteyttä Pakkasmarjaan.');
        return;
      }

      $('.contract-view-details-container .contract-view-details-content').empty();
      $('<i>')
        .addClass('fa fa-spinner fa-spin')
        .appendTo($(e.target).closest('.contract-list-item'));

      $(document.body).pakkasmarjaBerriesRest('listDeliveryPlaces').then((deliveryPlaces) => {
        $(document.body).pakkasmarjaBerriesRest('listContractPrices', contract.id).then((contractPrices) => {
          $(document.body).pakkasmarjaBerriesRest('getContractDocument', contract.id).then((contractDocument) => {
            $(document.body).pakkasmarjaBerriesRest('listPastUserContractsByItemGroupId', contract.itemGroup.id).then((pastContracts) => {
              pastContracts.sort((c1, c2) => {
                return c2.year - c1.year;
              });
              const recentPastContracts = pastContracts.slice(0, 2);
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

              const activePrices = [];
              const pastPrices = [];
              const currentYear = (new Date()).getFullYear();
              contractPrices.forEach((contractPrice) => {
                if (contractPrice.year === currentYear) {
                  activePrices.push(contractPrice);
                } else if(contractPrice.year === (currentYear - 1) || contractPrice.year === (currentYear - 2)) {
                  pastPrices.push(contractPrice);
                }
              });

              $(e.target).closest('.contract-list-item').find('.fa-spinner').remove();
              $('.contract-view-details-container .contract-view-details-content').empty();
              const listView = $('.contract-view .contract-list-view');
              const detailView = $('<div>')
                .html(pugContractDetails({contract: contract, deliveryPlaces: deliveryPlaces, activePrices: activePrices, terms: data, pastPrices: pastPrices, pastContracts: recentPastContracts}))
                .addClass('contract-detail-container')
                .hide()
                .appendTo(device.platform === 'browser' ? $('.contract-view-details-container .contract-view-details-content') : $('.contract-view .view-content-container'));

              detailView.find('.btn-link').click();
              $(detailView).show('slide', { direction: 'right' }, 200, () => {
                this._showProgressIndicator();
                this._updateProgressIndicator(1);
              });

              if (device.platform !== 'browser') {
                $(listView).hide('slide', { direction: 'left' }, 200);
              }
            });
          });
        });
      });
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'contracts') {
        this.reloadContracts();
        this._showDetailsPlaceholder();
      } else {
        this._hideDetailsPlaceholder();
      }
    },
    
    _resetDetailsPlaceHolder: function() {
      $('.contract-view-details-container').remove();
      this._showDetailsPlaceholder();
    },
    
    _showDetailsPlaceholder: function() {
      if (device.platform === 'browser') {
        $('.chat-container')
          .removeClass('chat-container-visible')
          .hide();
        $('<div>')
          .addClass('contract-view-details-container')
          .html(pugContractDetailsPlaceholder())
          .insertAfter('.chat-container');
      }
    },
    
    _hideDetailsPlaceholder: function() {
      if (device.platform === 'browser') {
        $('.contract-view-details-container').remove();
        $('.chat-container')
          .addClass('chat-container-visible')
          .show();
      }
    },
    
    _showProgressIndicator: function() {
      if (device.platform === 'browser') {
        $('.contract-view-details-container .contract-view-header-text').hide();
        $('.contract-view-details-container .contract-progress-indicator').show();
      } else {
        $('.contract-view-header-text').hide();
        $('.contract-progress-indicator').show();
      }
    },
    
    _hideProgressIndicator: function() {
      if (device.platform === 'browser') {
        $('.contract-view-details-container .contract-view-header-text').hide();
        $('.contract-view-details-container .contract-progress-indicator').show();
      } else {
        $('.contract-progress-indicator').hide();
        $('.contract-view-header-text').show();
      }
    },
    
    _updateProgressIndicator: function(phase) {
      $('.contract-progress-indicator').find('.fa').removeClass('active');
      $('.contract-progress-indicator').find(`.fa[data-phase="${phase}"]`).addClass('active');
    },
    
    _loadContracts: function () {
      $(document.body).pakkasmarjaBerriesRest('findUserContact').then((contact) => {
        
        $(document.body).pakkasmarjaBerriesRest('listUserContracts').then((contracts) => {
          this._removeContractLoaders();
          const activeContracts = contracts.filter(contract => contract.status === 'APPROVED');
          const pendingContracts = contracts.filter(contract => contract.status === 'DRAFT' || contract.status === 'ON_HOLD' || contract.status === 'REJECTED' );
          
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
    },
    
    _emptyContractList: function(list) {
       $(list)
        .find('.contract-list-item')
        .remove();
        
       $('<i>')
        .addClass('contract-list-loader fa fa-spinner fa-spin')
        .appendTo($(list));
    },
    
    _removeContractLoaders: function() {
      $('.frozen-list.active-contract-list-container').find('.contract-list-loader').remove();
      $('.fresh-list.active-contract-list-container').find('.contract-list-loader').remove();
      $('.fresh-list.pending-contract-list-container').find('.contract-list-loader').remove();
      $('.frozen-list.pending-contract-list-container').find('.contract-list-loader').remove();
    },
    
    reloadContracts: function() {
      this._emptyContractList($('.frozen-list.active-contract-list-container'));
      this._emptyContractList($('.fresh-list.active-contract-list-container'));
      this._emptyContractList($('.fresh-list.pending-contract-list-container'));
      this._emptyContractList($('.frozen-list.pending-contract-list-container'));
      this._loadContracts();
    },
    
    openListView: function() {
      this._hideProgressIndicator();
      const listView = $('.contract-view .contract-list-view');
      const detailView = device.platform === 'browser' ? $('.contract-view-details-container .contract-view-details-content') :  $('.contract-view .contract-detail-container');
      this.reloadContracts();

      $(detailView).hide('slide', { direction: 'right' }, 200, () => {
        this._resetDetailsPlaceHolder();
      });
      
      if (device.platform !== 'browser') {
        $(listView).show('slide', { direction: 'left' }, 200);
      }
    },
    
    openContractDetailsView: function() {
      const detailView = device.platform === 'browser' ? $('.contract-view-details-container .contract-details-content .details-container') : $('.contract-view .contract-details-content .details-container');
      const termsView = device.platform === 'browser' ? $('.contract-view-details-container .contract-details-content .contract-terms-view') : $('.contract-view .contract-details-content .contract-terms-view');
       
      $(termsView).hide('slide', { direction: 'right' }, 200);
      $(detailView).show('slide', { direction: 'left' }, 200);      
    }
    
  });
})();

