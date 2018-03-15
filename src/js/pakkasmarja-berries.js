/* jshint esversion: 6 */
/* global getConfig */

(function(){
  'use strict';
  
  $.widget("custom.pakkasmarjaBerries", { 
    
    options: {
      bottomScrollOffset: 150,
      logDebug: false
    },
    
    _create : function() {
      const serverConfig = getConfig().server;
      const secure = serverConfig.secure;
      const host = serverConfig.host;
      const port = serverConfig.port;
      const httpProtocol = secure ? 'https' : 'http';
      const wsProtocol = secure ? 'wss' : 'ws';
      const serverUrl = httpProtocol + '://' + host + ':' + port;
      const wsUrl = wsProtocol + '://' + host + ':' + port;
      
      this._serverUrl = serverUrl;
      this._versionChecked = false;
      this._restoreTriggered = false;
      
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('reconnect', $.proxy(this._onReconnect, this));
      this.element.on('authenticated', $.proxy(this._onAuthenticated, this));
      this.element.on('joined', $.proxy(this._onJoined, this));
      
      this.element.pakkasmarjaBerriesClient({
        wsUrl: wsUrl,
        serverUrl: serverUrl,
        logDebug: this.options.logDebug
      });
      
      this.element.pakkasmarjaBerriesAuth({
        serverUrl: serverUrl
      });
      
      this.element.pakkasmarjaBerriesNews();
      
      this.element.pakkasmarjaBerriesChatThreads({
        serverUrl: serverUrl
      });
      
      this.element.pakkasmarjaBerriesQuestionGroups({
        serverUrl: serverUrl
      });
      
      this.element.pakkasmarjaBerriesPushNotifications({
        logDebug: this.options.logDebug
      });

      this.element.pakkasmarjaBerriesRest({
        basePath: `${serverUrl}/rest/v1`
      });
      
      this.element.pakkasmarjaBerriesMenu();
      this.element.pakkasmarjaBerriesSettingsMenu();
      this.element.pakkasmarjaBerriesProfileMenu();
      this.element.pakkasmarjaBerriesContracts();
      
      $(".chat-container").pakkasmarjaBerriesChatThread({
        serverUrl: serverUrl,
        logDebug: this.options.logDebug
      });
      
      const swiperOptions = {};
      
      if ('browser' === device.platform) {
        swiperOptions.onlyExternal = true;
      }
      
      this.horizontalSwiper = new Swiper('.swiper-horizontal', swiperOptions);
      this.horizontalSwiper.on('onSlideChangeEnd', (swiper) => {this._onSlideChangeEnd(swiper); });
      this._resizeSlides();
      
      this.element.find('.secondary-menu .menu-item').on('click', (event) => { this._onMenuItemClick(event); });
      
      this.element.pakkasmarjaBerriesAuth('authenticate'); 
      
      $(window).scroll($.proxy(this._onWindowScroll, this));
      
      this.element.pakkasmarjaBerriesDeviceControls();
    },
    
    sessionId: function () {
      return this.element.pakkasmarjaBerriesAuth('sessionId');
    },
    
    restoreMainView() {
      this._restoreTriggered = false;
      $('.swiper-slide, .secondary-menu, .navbar-top').show("slide", { direction: "left", complete: () => {        
        if (!this._restoreTriggered) {
          this._restoreTriggered = true;
          this.updateSwiper();
          $("body").removeClass("chat-conversation-open");
          $("body").removeClass("question-group-open");
          $("body").removeClass("question-group-thread-open");
          this.element.trigger('mainViewRestore', {
            'activePage': this.activePage()
          });
        }
      } }, 300);
    },
    
    activePage: function () {
      return $('.menu-item.active').attr('data-page');
    },
    
    activeIndex: function () {
      return $('.menu-item.active').attr('data-slide-index');
    },
    
    updateSwiper: function (pageIndex) {
      const activePage = this.activeIndex();
      this.horizontalSwiper.update();
      this.horizontalSwiper.slideTo(pageIndex >= 0 ? pageIndex : activePage, 0);
      this._resizeSlides();
    },
    
    back: function () {
      const backStateData = JSON.parse($("body").attr('data-back-state-data') || '{}');
      
      if ($(document.body).pakkasmarjaBerriesMenu('isMenuOpen')) {
        $(document.body).pakkasmarjaBerriesMenu('closeHamburgerMenu');
      } else if ($(document.body).pakkasmarjaBerriesSettingsMenu('isMenuOpen')) {
        $(document.body).pakkasmarjaBerriesSettingsMenu('closeSettingsMenu');
      } else if (this._checkBodyClass('chat-conversation-open')) {
        if ('browser' !== device.platform) {
          $(".chat-container").hide("slide", { direction: "right" }, 300);
        }
        $(document.body).pakkasmarjaBerries('restoreMainView');
        this._removeBodyClass('chat-conversation-open');
      } else if (this._checkBodyClass('question-group-open')) {
        if ('browser' !== device.platform) {
          $(".chat-container").hide("slide", { direction: "right" }, 300);
        }
        $(document.body).pakkasmarjaBerries('restoreMainView');
        this._removeBodyClass('question-group-open');
      } else if (this._checkBodyClass('question-group-thread-open')) {
        if ('browser' !== device.platform) {
          $(".chat-container").hide("slide", { direction: "right" }, 300);
          this._backToQuestionGroup(backStateData);
        } else {
          $("body").addClass('question-group-open');
          $(document.body).pakkasmarjaBerries('restoreMainView');
        }
        
      } else {
        navigator.app.exitApp(); 
      }
    },
    
    _backToQuestionGroup(backStateData) {
      $('.swiper-slide, .secondary-menu, .navbar-top').show("slide", { direction: "left", complete: () => {
        $(document.body).pakkasmarjaBerriesQuestionGroups('selectQuestionGroup', backStateData.questionGroupId, backStateData.questionGroupRole, backStateData.questionGroupTitle, backStateData.questionGroupImageUrl);
        this._removeBodyClass('question-group-thread-open');
        $("body").addClass('question-group-open');
      } }, 300);
    },
    
    _checkBodyClass: function (className) {
      return $("body").hasClass(className);
    },
    
    _removeBodyClass: function(className) {
      $("body").removeClass(className);
    },
    
    _checkVersion: function() {
      $.ajax({
        url: `${this._serverUrl}/version`,
        dataType: 'text',
        success: (version) => {
          if (version != '1.2.7') {
            navigator.notification.alert('Uusi versio sovelluksesta saatavilla.', () => {}, 'Uusi versio', 'OK');
          }
        }
      });
    },
    
    _resizeSlides: function () {
      $('.swiper-slide-active').css({
        'height': 'auto',
        'min-height': 'calc(100vh - 95px)'
      });
      
      $('.swiper-slide:not(.swiper-slide-active)').css({
        'height': '0',
        'min-height': '0'
      });
    },
    
    _onWindowScroll: function (event) {
      const bodyScrollTop = $(document.body).scrollTop();
      const maxScroll = $(document).height() - $(window).height();
      
      if (bodyScrollTop >= (maxScroll - this.options.bottomScrollOffset)) {
        $(document).trigger('scrollBottom', {
          scrollTop: bodyScrollTop,
          scrollTopMax: maxScroll
        });
      }
    },
    
    _onSlideChangeEnd: function(swiper) {    
      this._resizeSlides();
      
      $('.secondary-menu')
        .find('.menu-item.active')
        .removeClass('active');
      
      $('.secondary-menu')
        .find('.menu-item[data-slide-index="'+ swiper.activeIndex +'"]')
        .addClass('active');

      this.element.trigger('pageChange', {
        'activePage': this.activePage()
      });
    },
    
    _onMenuItemClick: function(event) {
      const clickedIndex = $(event.target).attr('data-slide-index');
      this.horizontalSwiper.slideTo(clickedIndex);
    },

    _onAuthenticated: function () {
      this.element.pakkasmarjaBerriesAuth('join');
    },
    
    _onJoined: function () {
      this.element.pakkasmarjaBerriesClient('connect', this.sessionId());
    },
    
    _onConnect: function () {
      $('.connecting-modal').hide();
      if ('browser' !== device.platform) {
        cordova.plugins.photoLibrary.requestAuthorization(
          () => {
            if(!this._versionChecked) {
              this._versionChecked = true;
              setTimeout(() => {
                this._checkVersion();
              }, 1000);
            }

          },
          (err) => {
            navigator.app.exitApp();
          },
          {
            read: true,
            write: true
          }
        );
      }
    },
    
    _onReconnect: function () {
      $('.connecting-modal').show();
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).pakkasmarjaBerries();
  });

})();

