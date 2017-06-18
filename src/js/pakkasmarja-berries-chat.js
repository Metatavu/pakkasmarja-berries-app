/* jshint esversion: 6 */
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
      
      this.element.on('keydown', '.message-input', $.proxy(this._onMessageInputClick, this));
      
      
      
    },
    
    _onChatElementClick: function(event) {
      event.preventDefault();
      this.joinChat();
    },
    
    _onChatCloseElementClick: function(event) {
      event.preventDefault();
      this.leaveChat();
    },
    
    _onMessageInputClick: function (event) {
      if (event.which === 13) {
        const content = $(event.target).val();
        if (content) {
          $(document.body).pakkasmarjaBerriesClient('sendMessage', {
            'type': 'send-message',
            'threadId': '8c8ba345-8f8c-4283-ab4c-a1b5ec323be8',
            'contents': content
          });
        }
      }
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
