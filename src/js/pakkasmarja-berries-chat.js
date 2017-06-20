/* jshint esversion: 6 */
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChat", {
    
    options: {      
    },
    
    _create: function() {
      this.currentChat = null;
      // TODO: Paging threads
      // TODO: Paging messages
      
      this.element.on('click', '.chat-thread', $.proxy(this._onChatThreadClick, this));
      this.element.on('click', '.chat-close-btn', $.proxy(this._onChatCloseElementClick, this));
      this.element.on('keydown', '.message-input', $.proxy(this._onMessageInputClick, this));
      
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:threads-added', $.proxy(this._onThreadsAdded, this));
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
    },
    
    joinThread: function(threadId) {
      $(`.chat-container .speech-wrapper`).empty().addClass('loading');
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-messages',
        'thread-id': threadId
      });
      
      $(".swiper-slide, .secondary-menu").hide("slide", { direction: "left" }, 300);
      $(".chat-container").show("slide", { direction: "right" }, 300);
    },
    
    leaveChat: function() {
      $(".chat-container").hide("slide", { direction: "right" }, 300);
      $(".swiper-slide, .secondary-menu").show("slide", { direction: "left" }, 300);
    },
    
    _addThreads: function (threads) {
      threads.forEach((thread) => {      
        const categorySelector = thread.type === 'conversation' ? '.conversations-view' : '.questions-view';  
        $(`.chat-thread[data-id=${thread.id}]`).remove();
        $(`${categorySelector} ul`).append(pugChatThread(thread));
      });
    },
    
    _addMessages: function (messages) {
      $(`.chat-container .speech-wrapper`).removeClass('loading');
      messages.forEach((message) => {      
        $(`.chat-message[data-id=${message.id}]`).remove();
        $(`.chat-container .speech-wrapper`).append(pugChatMessage(message));
      });
    },
    
    _onChatThreadClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-thread');
      
      this.joinThread($(element).attr('data-id'));
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
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-threads',
        'thread-type': 'conversation'
      });
    },
    
    _onThreadsAdded: function (event, data) {
      this._addThreads(data.threads);
    },
    
    _onMessagesAdded: function (event, data) {
      this._addMessages(data.messages);
    }
    
  });
})();
