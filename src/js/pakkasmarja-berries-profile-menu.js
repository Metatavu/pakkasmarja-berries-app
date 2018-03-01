/* jshint esversion: 6 */
/* global cordova, _ */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesProfileMenu", {
    
    _create: function () {
      this.element.on('click', '.profile-button', $.proxy(this._onProfileMenuClick, this));
      this.element.on('click', '.close-menu-btn', $.proxy(this._onCloseMenuClick, this));
      this.element.on('click', '.save-contact-btn', $.proxy(this._onSaveContactClick, this));
      
    },

    closeProfileMenu: function () {
      $(".profile-menu").removeClass('menu-open');
      $(".profile-menu").hide("slide", { direction: "right" }, 200);
      $(".close-menu-btn").hide();
      $(".settings-btn").show();
      $(".hamburger-menu-button").show();
    },
    
    isMenuOpen: function() {
      return $(".profile-menu").hasClass('menu-open');
    },
    
    _onProfileMenuClick: function () {
      if (!$(".profile-menu").hasClass('menu-open')) {
        if ($(document.body).pakkasmarjaBerriesMenu('isMenuOpen')) {
          $(document.body).pakkasmarjaBerriesMenu('closeHamburgerMenu');
        }
        
        if ('browser' !== device.platform) {
          this._disableScrolling();
        }
        
        this._openProfileMenu();
      }
    },
    
    _onCloseMenuClick: function () {
      if ($(".profile-menu").hasClass('menu-open')) {
        
        if ('browser' !== device.platform) {
          this._enableScrolling();
        }
        
        this.closeProfileMenu();
      }
    },
    
    _onSaveContactClick: function () {
      this._updateContact();
    },
    
    _openProfileMenu: function () {
      $(".profile-menu").addClass('menu-open');
      $(".profile-menu").show("slide", { direction: "right" }, 200);
      $(".settings-btn").hide();
      $(".hamburger-menu-button").hide();
      $(".close-menu-btn").show();
      this._loadValues();
    },
    
    _updateContact: function() {
      const data = {};
      data.phoneNumbers = [
        $(".profile-menu").find("#phoneNumber1Input").val(),
        $(".profile-menu").find("#phoneNumber2Input").val()
      ];
      
      data.addresses = [{
          streetAddress: $(".profile-menu").find("#streetAddress1Input").val(),
          postalCode: $(".profile-menu").find("#postalCode1Input").val(),
          city: $(".profile-menu").find("#city1Input").val()
        },{
          streetAddress: $(".profile-menu").find("#streetAddress2Input").val(),
          postalCode: $(".profile-menu").find("#postalCode2Input").val(),
          city: $(".profile-menu").find("#city2Input").val() 
        }
      ];
      
      data.firstName = $(".profile-menu").find("#firstNameInput").val();
      data.lastName = $(".profile-menu").find("#lastNameInput").val();
      data.companyName = $(".profile-menu").find("#companyNameInput").val();
      data.email = $(".profile-menu").find("#emailInput").val();
      data.BIC = $(".profile-menu").find("#BICInput").val();
      data.IBAN = $(".profile-menu").find("#IBANInput").val();
      data.taxCode = $(".profile-menu").find("#taxCodeInput").val();
      data.vatLiable = $(".profile-menu").find("#vatLiableInput").val();
      data.audit = $(".profile-menu").find("#auditInput").val();
      
      $(document.body).pakkasmarjaBerriesRest('updateUserContact', data).then((updatedData) => {
        new Noty({
            type: 'success',
            text: 'Tietojen päivittäminen onnistui.',
            timeout: 2500
        }).show();
        setTimeout(() => {
          this._onCloseMenuClick();
        }, 2000);
      })
      .catch((err) => {
        new Noty({
            type: 'error',
            text: 'Tietojen tallentamisessa tapahtui virhe, yritä myöhemmin uudelleen.',
            timeout: 2500
        }).show();
      });
    },
    
    _loadValues: function() {
      $(document.body).pakkasmarjaBerriesRest('findUserContact').then((data) => {
        let vatLiable = "";
        switch (data.vatLiable) {
          case 'Y':
            vatLiable = 'YES';
          break;
          case 'N':
            vatLiable = 'NO';
          break;
          default:
            vatLiable = data.vatLiable || "";
          break;
        }
        const address1 = data.addresses[0] || {};
        const address2 = data.addresses[1] || {};

        $(".profile-menu").find("#auditInput").val(data.audit || "");
        $(".profile-menu").find("#vatLiableInput").val(vatLiable);
        $(".profile-menu").find("#firstNameInput").val(data.firstName || "");
        $(".profile-menu").find("#lastNameInput").val(data.lastName || "");
        $(".profile-menu").find("#companyNameInput").val(data.companyName || "");
        $(".profile-menu").find("#phoneNumber1Input").val(data.phoneNumbers[0] || "");
        $(".profile-menu").find("#phoneNumber2Input").val(data.phoneNumbers[1] || "");
        $(".profile-menu").find("#emailInput").val(data.email || "");
        $(".profile-menu").find("#BICInput").val(data.BIC || "");
        $(".profile-menu").find("#IBANInput").val(data.IBAN || "");
        $(".profile-menu").find("#taxCodeInput").val(data.taxCode || "");
        $(".profile-menu").find("#streetAddress1Input").val(address1.streetAddress || "");
        $(".profile-menu").find("#postalCode1Input").val(address1.postalCode || "");
        $(".profile-menu").find("#city1Input").val(address1.city || "");
        $(".profile-menu").find("#streetAddress2Input").val(address2.streetAddress || "");
        $(".profile-menu").find("#postalCode2Input").val(address2.postalCode || "");
        $(".profile-menu").find("#city2Input").val(address2.city || "");
        
      });
    },

    _disableScrolling: function () {
      $('html, body').css({
        overflow: 'hidden',
        height: '100%'
      });
    }, 
    
    _enableScrolling: function () {
      $('html, body').css({
        overflow: 'auto',
        height: 'auto'
      });
    }
  });
})();

