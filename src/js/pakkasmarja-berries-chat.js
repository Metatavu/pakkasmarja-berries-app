(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChat", {
    _create: function() {
      this.currentChat = null;
      $(this.element).on('click', '.chat-open-btn', (e) => {
        this._onChatElementClick(e);
      });
      $(this.element).on('click', '.chat-close-btn', (e) => {
        this._onChatCloseElementClick(e);
      });
    },
    
    _onChatElementClick: function(event) {
      event.preventDefault();
      this.joinChat();
    },
    
    _onChatCloseElementClick: function(event) {
      event.preventDefault();
      this.leaveChat();
    },
    joinChat: function() {
      $(".swiper-slide").hide("slide", { direction: "left" }, 300);
      $(".secondary-menu").hide("slide", { direction: "left" }, 300);
      $(".chat-container").show("slide", { direction: "right" }, 300);
    },
    
    leaveChat: function() {
      $(".chat-container").hide("slide", { direction: "right" }, 300);
      $(".swiper-slide").show("slide", { direction: "left" }, 300);
      $(".secondary-menu").show("slide", { direction: "left" }, 300);
    }
    
  });
})();
