/* jshint esversion: 6 */
/* global cordova */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesSettingsMenu", {
    
    _create: function () {
      this.element.on('click', '.settings-btn', $.proxy(this._onSettingsMenuClick, this));
      this.element.on('click', '.management-button', $.proxy(this._onManagementButtonClick, this));
      this.element.on('click', '.notification-button', $.proxy(this._onNotificationButtonClick, this));
      this.element.on('click', '.close-notification-view', $.proxy(this._onNotificationCloseButtonClick, this));
      this.element.on('change', '.select-setting', $.proxy(this._onSettingsChanged, this));
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
    
    _onNotificationButtonClick: function () {
      $('.notification-settings-view').show();
    },
    
    _onNotificationCloseButtonClick: function () {
      $('.notification-settings-view').hide();
    },
    
    _onSettingsChanged: function () {
      const userSettings = {};
      $(this.element).find('.select-setting').each((index, input) => {
        let settingKey = $(input).attr('name');
        let settingValue = $(input).val();
        
        userSettings[settingKey] = settingValue;
      });
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'user-settings-changed',
        'userSettings': userSettings
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

