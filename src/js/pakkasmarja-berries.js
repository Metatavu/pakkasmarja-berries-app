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
      this.element.pakkasmarjaBerriesChatThreads();
      $(".chat-container").pakkasmarjaBerriesChatThread();
      
      this.horizontalSwiper = new Swiper('.swiper-horizontal', { });
      this.horizontalSwiper.on('onSlideChangeEnd', (swiper) => {this._onSlideChangeEnd(swiper); });
      this._resizeSlides();
      
      this.element.find('.secondary-menu .menu-item').on('click', (event) => { this._onMenuItemClick(event); });
      
      this.element.pakkasmarjaBerriesAuth('authenticate'); 
      
      $(window).scroll($.proxy(this._onWindowScroll, this));
    },
    
    sessionId: function () {
      return this.element.pakkasmarjaBerriesAuth('sessionId');
    },
    
    activePage: function () {
      return $('.menu-item.active').attr('data-page');
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
    },
    
    _onMenuItemClick: function(event)  {
      const clickedIndex = $(event.target).attr('data-slide-index');
      this.horizontalSwiper.slideTo(clickedIndex);
    },

    _onAuthenticated: function () {
      this.element.pakkasmarjaBerriesAuth('join');
    },
    
    _onJoined: function () {
      this.element.pakkasmarjaBerriesClient('connect', this.sessionId());
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).pakkasmarjaBerries();      
  });

})();