(function(){
  'use strict';
  
  $.widget("custom.pakkasmarjaBerries", { 
    _create : function() {
      this.element.pakkasmarjaBerriesChat();
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
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).pakkasmarjaBerries();      
  });

})();