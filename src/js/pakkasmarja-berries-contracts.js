/* jshint esversion: 6 */
/* global cordova, _ */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesContracts", {
    
    _create: function () {
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(this.element).on('click', '.contract-list-item', this._onContractItemClick.bind(this));                                                                                                                                                                                                                                                                                                                                                                                  
      $(this.element).on('click', '.contract-back-btn', this._onBackBtnClick.bind(this));
      $(this.element).on('click', '.sign-back-btn', this._onBackToDetailsClick.bind(this));
      $(this.element).on('click', '.accept-btn', this._onAcceptBtnClick.bind(this));
      $(this.element).on('click', '.sign-btn', this._onSignBtnClick.bind(this));
      $(this.element).on('click', '.download-contract-btn', this._onDownloadContractBtnClick.bind(this));
      $(this.element).on('click', '.past-prices-btn', this._onPastPricesBtnClick.bind(this));
      $(this.element).on('click', '.past-contracts-btn', this._onPastContractsBtnClick.bind(this));
      $(this.element).on('click', '.deny-btn', this._onDenyBtnClick.bind(this));
      $(this.element).on('click', '.add-hectare-row-btn', this._onAddHectareButtonRowClick.bind(this));
      $(this.element).on('click', '.suggest-berry-btn', this._onSuggestBerryButtonClick.bind(this));
      $(this.element).on('click', '.table-popup-link', this._onTablePopupLinkClick.bind(this));
      $(this.element).on('keyup', '#contractAmountInput', this._onContractQuantityOrDeliveryPlaceChange.bind(this));
      $(this.element).on('change', '#contractDeliveryPlaceInput', this._onContractQuantityOrDeliveryPlaceChange.bind(this));
      $(this.element).on('change', '.hectare-table input', this._onHectareTableInputChange.bind(this));
    },

    _onTablePopupLinkClick: function(e) {
      const data = $(e.target).closest(".table-popup-link").attr("data-table");
      bootbox.dialog({
        closeButton: true,
        message: `<div style="overflow-x:auto;">${data}</div><small>Jos taulukko ei näy kokonaan, voit vierittää sitä sivusuunnassa.</small>`,
        size: "large"
      });
    },

    _onHectareTableInputChange: function() {
      this._updateHectareTableInformation();
    },

    _onSuggestBerryButtonClick: function(e) {
      const suggestBerryDialog = bootbox.dialog({
        title: 'Ehdota sopimusta jostain muusta marjasta.',
        closeButton: false,
        message: '<p><i class="fa fa-spin fa-spinner"></i> Ladataan...</p>',
        buttons: {
          cancel: {
            label: 'Peruuta',
            className: "btn-default",
            callback: function() {
            }
          },
          suggestBerry: {
            label: 'Lähetä',
            className: "btn-primary",
            callback: function() {
              const newBerry = suggestBerryDialog.find('#newBerryItemGroupSelect').val();
              const newBerrySize = suggestBerryDialog.find('#newBerryItemGroupSizeInput').val();
              const newBerryInfo = suggestBerryDialog.find('#newBerryAdditionalInfoInput').val();
              suggestBerryDialog.find('.bootbox-body').html('<p><i class="fa fa-spin fa-spinner"></i> Ladataan...</p>');
              const contractsQuestionGroupId = $(document.body).pakkasmarjaBerriesAppConfig('get', 'contracts-question-group');

              let message = `Hei, haluaisin ehdottaa uutta sopimusta marjasta: ${newBerry}.`;
              if (newBerrySize) {
                message += ` Määräarvio on ${newBerrySize} kg.`;
              }
              if (newBerryInfo) {
                message += ` Lisätietoa: ${newBerryInfo}`;
              }
              
              let suggestMessageTimeout = null;

              const observer = new MutationObserver((mutationsList) => {
                mutationsList.forEach((mutation) => {
                  if (mutation.type === 'childList') {
                    const addedNodes = mutation.addedNodes;
                    addedNodes.forEach((addedNode) => {
                      if ($(addedNode).hasClass('question-group') && $(addedNode).attr('data-id') == contractsQuestionGroupId) {
                        $(addedNode).click();
                        observer.disconnect();
                        $(document.body).one('question-thread-selected', () => {
                          $(".chat-container").pakkasmarjaBerriesChatThread('sendMessage', message);
                          suggestBerryDialog.modal('hide');
                          clearTimeout(suggestMessageTimeout);
                        });
                      }
                    });
                  }
                });
              });
              
              suggestMessageTimeout = setTimeout(() => {
                observer.disconnect();
                suggestBerryDialog.modal('hide');
                new Noty({
                  timeout: 5000,
                  text: 'Virhe lähetettäessä viestiä. Yritä myöhemmin uudelleen.',
                  type: 'error'
                }).show();
              }, 20000);
              
              $(document.body).pakkasmarjaBerriesQuestionGroups('reset');
              observer.observe($('.questions-view ul')[0], { attributes: false, childList: true });
              $('.menu-item[data-page="questions"]').click();

              return false;
            }
          }
        }
      });

      suggestBerryDialog.init(() => {
        const category = $(e.target).closest('.suggest-berry-btn').attr('data-category');
        $(document.body).pakkasmarjaBerriesRest('listItemGroups').then((itemGroups) => {
          $(document.body).pakkasmarjaBerriesRest('listContractsByCategoryAndYear',category, (new Date()).getFullYear()).then((contracts) => {
            const contractItemGroupIds = contracts.map((contract) => {return contract.itemGroupId; });
            const itemGroupsInCategory = itemGroups.filter(itemGroup => itemGroup.category === category);
            const itemGroupsWithoutContract = itemGroupsInCategory.filter(itemGroupInCategory => contractItemGroupIds.indexOf(itemGroupInCategory.id) === -1);
            suggestBerryDialog.find('.bootbox-body').html(pugSuggestBerryDialog({itemGroups: itemGroupsWithoutContract}));
          });
        });
      });
    },

    _onAddHectareButtonRowClick: function() {
      if ($('.hectare-table').length > 0) {
        const minimumProfit = $('.hectare-table').attr('data-minimum-profit');
        const newRow = [
          '<input class="form-control" type="text" name="name" value="" />',
          '<input class="form-control" type="number" name="size" step="0." min="0" value="" />'
        ];

        if (minimumProfit) {
          newRow.push(`<input class="form-control" type="text" name="species" value="" /><input type="hidden" name="profitEstimation" value="${minimumProfit}" />`);
        } else {
          newRow.push('<input class="form-control" type="text" name="species" value="" />');
          newRow.push('<input class="form-control" type="number" name="profitEstimation" min="0" value="" />');
        }
        
        $('.hectare-table').dataTable().api().row.add(newRow).draw(false);
      }
    },
    
    _getHectareTableData: function() {
      let result = [];
      
      $('.hectare-table tbody tr').each((rowIndex, rowElement) => {
        let row = {};
        $(rowElement).find('input').each((inputIndex, inputElement) => {
          const key = $(inputElement).attr('name');
          const value = $(inputElement).val();
          if (key && value) {
            row[key] = value;
          }
        });
        
        if (!_.isEmpty(row)) {
          result.push(row);
        }
      });
      
      return result;
    },
    
    _updateHectareTableInformation: function() {
      const minimumProfit = $('.hectare-table').attr('data-minimum-profit');
      const data = this._getHectareTableData();
      const blocks = data.length;
      const totalProfit = this._getTotalHectareAmount(data);
      const proposedAmount = parseInt($('#contractAmountInput').val());
      let totalHectares = 0;
      data.forEach((row) => {
        totalHectares += parseInt(row.size || 0, 10);
      });
      
      let text = '';
      
      if (minimumProfit) {
        text = `<span>Lohkoja yhteensä ${blocks} kpl. Pinta-alaa yhteensä ${totalHectares} ha.</span><br/>`;
        if (totalProfit > proposedAmount) {
          text += `<span class="hectare-table-error"><i class="fa fa-exclamation"/> Minimisopimusmäärä on ${totalProfit} kg, perustuen hehtaarikohtaiseen toimitusmääräminimiin 500 kg / ha. Lisätietoja sopimuksen kohdasta Sopimuksen mukaiset toimitusmäärät, takuuhinnat ja bonus satokaudella ${(new Date()).getFullYear()}</span>`;
        } else {
          text += `<span>Minimisopimusmäärä on ${totalProfit} kg, perustuen hehtaarikohtaiseen toimitusmääräminimiin 500 kg / ha. Lisätietoja sopimuksen kohdasta Sopimuksen mukaiset toimitusmäärät, takuuhinnat ja bonus satokaudella ${(new Date()).getFullYear()}</span>`;
        }
      } else {
        text = `<span>Lohkoja yhteensä ${blocks} kpl. Pinta-alaa yhteensä ${totalHectares} ha. Tuotantoarvio yhteensä ${totalProfit} kg</span>`;
      }
      
      $('.hectare-table-information').html(text);

    },
    
    _getTotalHectareAmount(data) {
      let total = 0;
      data.forEach((row) => {
        const hectares = parseInt(row.size || 0, 10);
        const profitEstimation = parseInt(row.profitEstimation || 0, 10);
        total += hectares * profitEstimation;
      });
      return total;
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
      const signBtn = $(e.target).closest('.sign-btn');
      const contractId = signBtn.attr('data-contract-id');
      const ssn = signBtn.closest('.contract-footer-section').find('#ssnInput').val();
      if (!ssn) {
        bootbox.alert('Syötä henkilötunnus.');
        return;
      }

      const authService = signBtn.closest('.contract-footer-section').find('#authServiceInput').val();
      if (!authService) {
        bootbox.alert('Valitse tunnistautumispalvelu.');
        return;
      }

      const acceptedTerms = signBtn.closest('.contract-footer-section').find('#acceptTerms').is(':checked');
      if (!acceptedTerms) {
        bootbox.alert('Sinun tulee hyväksyä sopimusehdot ennen allekirjoitusta.');
        return;
      }
      
      const viableTosign = signBtn.closest('.contract-footer-section').find('#viableToSign').is(':checked');
      if (!viableTosign) {
        bootbox.alert('Sinun tulee olla viljelijän puolesta edustuskelpoinen.');
        return;
      }
      
      $('<i>')
        .addClass('fa fa-spinner fa-spin')
        .appendTo(signBtn);
      
      $(document.body).pakkasmarjaBerriesRest('createContractDocumentSignRequest', contractId, ssn, authService).then((contractDocumentSignRequest) => {
        signBtn.find('.fa-spinner').remove();
        if (device.platform === 'browser') {
          bootbox.dialog({ message: `Sopimus on nyt valmis allerkirjoitettavaksi.<br><br><a class="link-out" href="${contractDocumentSignRequest.redirectUrl}">Siirry allekirjoituspalveluun klikkaamalla tästä.</a>` });
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
      const itemGroupConfig = $(document.body).pakkasmarjaBerriesAppConfig('get', 'item-groups');
      const contract = JSON.parse($(e.target).closest('.accept-btn').attr('data-contract'));
      contract.proposedQuantity = parseInt($('#contractAmountInput').val());
      contract.proposedDeliveryPlaceId = $('#contractDeliveryPlaceInput').val();
      contract.quantityComment = $('#contractQuantityCommentInput').val();
      contract.deliveryPlaceComment = $('#contractDeliveryPlaceCommentInput').val();
      contract.areaDetails = this._getHectareTableData();
      contract.deliverAll = $('#deliverAllCheckBox').is(':checked') ? true : false;
      const totalHectareAmount = this._getTotalHectareAmount(contract.areaDetails);
      
      if (itemGroupConfig[contract.itemGroupId] && itemGroupConfig[contract.itemGroupId]['require-area-details'] && contract.areaDetails.length < 1) {
        bootbox.alert('Täytä hehtaaritaulukko.');
        return;
      }
      
      if (contract.itemGroup.minimumProfitEstimation && totalHectareAmount > contract.proposedQuantity) {
        bootbox.alert(`Sopimusmäärä oltava vähintään ${contract.itemGroup.minimumProfitEstimation} kg/ha`);
        return;
      }
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
      const activeContract = !$(e.target).closest('.contract-list-item').hasClass('pending-contract-list-item');
      const missingPrequisiteId = $(e.target).closest('.contract-list-item').attr('data-missing-prerequisite-id');
      if (missingPrequisiteId) {
        const missingPrequisiteDialog = bootbox.dialog({
          message: '<p><i class="fa fa-spin fa-spinner"></i> Ladataan...</p>'
        });
        missingPrequisiteDialog.init(() => {
          $(document.body).pakkasmarjaBerriesRest('findItemGroup', missingPrequisiteId).then((missingItemGroup) => {
            missingPrequisiteDialog.find('.bootbox-body').html(`<p>Tarkasta, muuta tarvittaessa ja hyväksy ensin sopimus marjasta: <b>${missingItemGroup.displayName || missingItemGroup.name}</b></p>`);
          });
        });
        return;
      }
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
          
              content.find('.hide-contract-accordion').remove();
          
              if (device.platform !== 'browser') {
                content.find('table').each((index, table) => {
                  const data = table.outerHTML;
                  const link = $("<a>")
                    .attr("href", "#")
                    .attr("data-table", data)
                    .addClass("table-popup-link")
                    .text('Näytä taulukko');

                  $(table).replaceWith(link);
                });
              }

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

              //TODO: remove and add itemgroupcategory to delivery place
              let deliveryPlacesForCurrentItemGroup = [];
              if (contract.itemGroup.category === 'FROZEN') {
                deliveryPlacesForCurrentItemGroup = deliveryPlaces.filter(deliveryPlace => deliveryPlace.name !== 'Muu');
              } else {
                deliveryPlacesForCurrentItemGroup = deliveryPlaces.filter(deliveryPlace => deliveryPlace.name === 'Muu' || deliveryPlace.name === 'Suonenjoki');
              }

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
                } else {
                  pastPrices.push(contractPrice);
                }
              });

              $(e.target).closest('.contract-list-item').find('.fa-spinner').remove();
              $('.contract-view-details-container .contract-view-details-content').empty();
              const listView = $('.contract-view .contract-list-view');
              const detailView = $('<div>')
                .html(pugContractDetails({activeContract: activeContract, contract: contract, deliveryPlaces: deliveryPlacesForCurrentItemGroup, activePrices: activePrices, terms: data, pastPrices: pastPrices, pastContracts: recentPastContracts}))
                .addClass('contract-detail-container')
                .hide()
                .appendTo(device.platform === 'browser' ? $('.contract-view-details-container .contract-view-details-content') : $('.contract-view .view-content-container'));

              detailView.find('.btn-link').click();
              $(detailView).show('slide', { direction: 'right' }, 200, () => {
                this._showProgressIndicator();
                this._updateProgressIndicator(1);
                
                const hectareTable = detailView.find('.hectare-table').DataTable({
                  searching: false,
                  ordering: false,
                  paging: false,
                  info: false
                });
              });

              if (device.platform !== 'browser') {
                $(listView).hide('slide', { direction: 'left' }, 200);
              }

              this._updateHectareTableInformation();
            });
          });
        });
      });
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'contracts') {
        $('.contract-list-view').show();
        this.reloadContracts();
        this._showDetailsPlaceholder();
      } else {
        $('.contract-list-view').hide();
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
    
    _getBusinessCode: function(federalTaxId) {
        if (federalTaxId && federalTaxId.toUpperCase().indexOf("FI") === 0) {
          let result = federalTaxId.substring(2);
          if (result.length === 8) {
            return `${result.substring(0, 7)}-${result.substring(7)}`;
          }
        }

      return "";
    },
    
    _loadContracts: function () {
      const itemGroupConfig = $(document.body).pakkasmarjaBerriesAppConfig('get', 'item-groups');
      
      $(document.body).pakkasmarjaBerriesRest('findUserContact').then((contact) => {
        
        $(document.body).pakkasmarjaBerriesRest('listUserContracts').then((contracts) => {
          this._removeContractLoaders();
          const activeContracts = contracts.filter(contract => contract.status === 'APPROVED');
          const pendingContracts = contracts.filter(contract => contract.status === 'DRAFT' || contract.status === 'ON_HOLD' || contract.status === 'REJECTED' );
          const onHoldOrApprovedContracts = contracts.filter(contract => contract.status === 'APPROVED' || contract.status === 'ON_HOLD'); 
          const activeItemGroupIds = onHoldOrApprovedContracts.map((onHoldOrApprovedContract) => {
            return onHoldOrApprovedContract.itemGroup.id;
          });

          activeContracts.forEach((activeContract) => {
            activeContract.contact = contact;
            activeContract.contact.businessCode = this._getBusinessCode(contact.taxCode);
            if (activeContract.itemGroup.category === 'FROZEN') {
              $('.frozen-list.active-contract-list-container').append(pugActiveContractListItem({contract: activeContract}));
            } else {
              $('.fresh-list.active-contract-list-container').append(pugActiveContractListItem({contract: activeContract}));
            }
          });
          pendingContracts.forEach((pendingContract) => {
            if (itemGroupConfig[pendingContract.itemGroup.id] && itemGroupConfig[pendingContract.itemGroup.id]['allow-delivery-all']) {
              pendingContract.allowDeliveryAll = true;
            }

            if (pendingContract.itemGroup.prerequisiteContractItemGroupId && activeItemGroupIds.indexOf(pendingContract.itemGroup.prerequisiteContractItemGroupId) < 0) {
              pendingContract.missingPrerequisite = true;
            } else {
              pendingContract.missingPrerequisite = false;
            }

            pendingContract.contact = contact;
            pendingContract.contact.businessCode = this._getBusinessCode(contact.taxCode);
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

