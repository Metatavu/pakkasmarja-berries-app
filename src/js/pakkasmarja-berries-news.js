(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesNews", {
    _create: function() {
      this.currentChat = null;
      $(this.element).on('click', '.news-open-btn', (e) => {
        this._onNewsElementClick(e);
      });
      $(this.element).on('click', '.news-close-btn', (e) => {
        this._onNewsCloseElementClick(e);
      });
    },
    
    _onNewsElementClick: function(event) {
      event.preventDefault();
      this.openNews();
    },
    
    _onNewsCloseElementClick: function(event) {
      event.preventDefault();
      this.closeNews();
    },
    openNews: function() {
      $(".swiper-slide").hide("slide", { direction: "left" }, 300);
      $(".secondary-menu").hide("slide", { direction: "left" }, 300);
      $(".navbar-top").hide("slide", { direction: "left" }, 300);
      $(".news-wrapper").show("slide", { direction: "right" }, 300);
    },
    
    closeNews: function() {
      $(".news-wrapper").hide("slide", { direction: "right" }, 300);
      $(".navbar-top").show("slide", { direction: "left" }, 300);
      $(".swiper-slide").show("slide", { direction: "left" }, 300);
    }
    
  });
})();
