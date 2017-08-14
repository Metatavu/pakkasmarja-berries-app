/* jshint esversion: 6 */
/* global cordova */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesMenu", {
    
    _create: function () {
      this.element.on('click', '.hamburger-menu-button', $.proxy(this._onHamburgerMenuClick, this));
      this.element.on('click', '.logout-button', $.proxy(this._onLogOutButtonClick, this));
      this.element.on('click', '.profile-button', $.proxy(this._onProfileButtonClick, this));
    },
    
    _onHamburgerMenuClick: function () {
      if (this.isMenuOpen()) {
        
        if ('browser' !== device.platform) {
          this._enableScrolling();
        }

        this.closeHamburgerMenu();
      } else {
        if ($(document.body).pakkasmarjaBerriesSettingsMenu('isMenuOpen')) {
          $(document.body).pakkasmarjaBerriesSettingsMenu('closeSettingsMenu');
        }

        if ('browser' !== device.platform) {
          this._disableScrolling();
        }

        this._openHamburgerMenu();
      }
    },
    
    _openHamburgerMenu: function () {
      $(".hamburger-menu").addClass('menu-open');
      $(".hamburger-menu").show("slide", { direction: "right" }, 200);
    },
    
    closeHamburgerMenu: function () {
      $(".hamburger-menu").removeClass('menu-open');
      $(".hamburger-menu").hide("slide", { direction: "right" }, 200);
    },
    
    isMenuOpen: function() {
      return $(".hamburger-menu").hasClass('menu-open');
    },
    
    _onLogOutButtonClick: function () {
      this.element.pakkasmarjaBerriesAuth('logout');
    },

    _onProfileButtonClick: function () {
      const accountUrl = $(document.body).pakkasmarjaBerriesAuth('getAccountUrl');
      if (accountUrl) {
        cordova.InAppBrowser.open(accountUrl, '_self', 'location=no,hardwareback=no,zoom=no');
      }
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

