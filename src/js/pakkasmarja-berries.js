/* global getConfig */

(function(){
  'use strict';
  
  $.widget("custom.pakkasmarjaBerries", { 
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
      this.element.on('connect', $.proxy(this._onConnect, this));
      
      this.element.pakkasmarjaBerriesClient({
        wsUrl: wsUrl,
        serverUrl: serverUrl
      });
      
      this.element.pakkasmarjaBerriesAuth({
        serverUrl: serverUrl
      });
      
      this.element.pakkasmarjaBerriesChat();
      this.element.pakkasmarjaBerriesNews();
      this.horizontalSwiper = new Swiper('.swiper-horizontal', {});
      this.verticalSwiper = new Swiper('.swiper-vertical', {
        scrollbar: '.swiper-scrollbar',
        direction: 'vertical',
        slidesPerView: 'auto',
        mousewheelControl: true,
        freeMode: true
      });
      this.horizontalSwiper.on('onSlideChangeEnd', (swiper) => {this._onSlideChangeEnd(swiper); });
      $(this.element).find('.secondary-menu .menu-item').on('click', (event) => { this._onMenuItemClick(event); });
      
      
      this.element.pakkasmarjaBerriesAuth('authenticate'); 
    },
    
    sessionId: function () {
      return this.element.pakkasmarjaBerriesAuth('sessionId');
    },
    
    _onSlideChangeEnd: function(swiper) {    
      $('.secondary-menu')
        .find('.menu-item')
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
      console.log("_onAuthenticated");
      this.element.pakkasmarjaBerriesAuth('join');
    },
    
    _onJoined: function () {
      this.element.pakkasmarjaBerriesClient('connect', this.sessionId());
    },
    
    _onConnect: function (event, data) {
      
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).pakkasmarjaBerries();      
  });

})();