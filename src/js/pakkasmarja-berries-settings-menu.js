/* jshint esversion: 6 */
/* global cordova */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesSettingsMenu", {
    
    _create: function () {
      this.element.on('click', '.settings-btn', $.proxy(this._onSettingsMenuClick, this));
      this.element.on('click', '.management-button', $.proxy(this._onManagementButtonClick, this));
    },
    
    _onSettingsMenuClick: function () {
      if ($(".settings-menu").hasClass('menu-open')) {
        this._enableScrolling();
        this.closeSettingsMenu();
      } else {
        if ($(document.body).pakkasmarjaBerriesMenu('isMenuOpen')) {
          $(document.body).pakkasmarjaBerriesMenu('closeHamburgerMenu');
        }
        this._disableScrolling();
        this._openSettingsMenu();
      }
    },
    
    _openSettingsMenu: function () {
      if ($(document.body).pakkasmarjaBerriesAuth('isAppManager')) {
        $(this.element).find('.management-button').show();
      } else {
        $(this.element).find('.management-button').hide();
      }
      
      $(".settings-menu").addClass('menu-open');
      $(".settings-menu").show("slide", { direction: "right" }, 200);
    },
    
    closeSettingsMenu: function () {
      $(".settings-menu").removeClass('menu-open');
      $(".settings-menu").hide("slide", { direction: "right" }, 200);
    },
    
    isMenuOpen: function() {
      return $(".settings-menu").hasClass('menu-open');
    },
    
    _onManagementButtonClick: function () {
      cordova.InAppBrowser.open('https://staging-hallinta-pakkasmarja.metatavu.io/wp-admin"', '_self', 'location=no,hardwareback=no,zoom=no');
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

