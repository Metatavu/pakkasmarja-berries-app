/* jshint esversion: 6 */
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChatThread", {
    
    options: {
      messagesLimit: 7,
      topScrollOffset: 150
    },
    
    _create: function() {
      this.activeThreadId = null;
      this.morePages = true;
      this.loading = false;
      this.page = 0;
      this.element.on('click', '.chat-close-btn', $.proxy(this._onChatCloseElementClick, this));
      this.element.on('keydown', '.message-input', $.proxy(this._onMessageInputClick, this));
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
      $(`.chat-conversation-wrapper`).scroll($.proxy(this._onWrapperScroll, this));
    },
    
    joinThread: function (threadId) {
      this.initialLoad = true;
      $(`.chat-container .speech-wrapper`).empty();
      this.activeThreadId = threadId;
      this.loadMessages(this.page);
      
      $(".swiper-slide, .secondary-menu").hide("slide", { direction: "left" }, 300);
      $(".chat-container").show("slide", { direction: "right" }, 300);
    },
      
    leaveThread: function() {
      this.activeThreadId = null;
      $(".chat-container").hide("slide", { direction: "right" }, 300);
      $(".swiper-slide, .secondary-menu").show("slide", { direction: "left" }, 300);
    },
      
    loadMessages: function (page) {
      this.loading = true;
      $(`.chat-container .speech-wrapper`).addClass('loading');
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-messages',
        'thread-id': this.activeThreadId,
        "max-results": this.options.messagesLimit,
        'first-result': page * this.options.messagesLimit
      });
    },
    
    isActive: function () {
      if (!this.activeThreadId) {
        return false;
      }
      
      const activePage = $(document.body).pakkasmarjaBerries('activePage');
      return (activePage === 'conversations') || (activePage === 'questions');
    },
    
    _sortMessages: function () {
      $('.speech-wrapper .chat-message').sort((newsItem1, newsItem2) => {
        const created1 = moment($(newsItem1).attr('data-created'));
        const created2 = moment($(newsItem2).attr('data-created'));
        return created1.diff(created2);
      }).appendTo('.speech-wrapper');
    },
    
    _addMessages: function (messages) {
      // TODO: correct thread?
      
      const scrollTop = $(`.chat-conversation-wrapper`).scrollTop();
      const marginTop = 120;
      
      $('.chat-container .speech-wrapper').removeClass('loading');
      
      const heightOld = $('.chat-container .speech-wrapper').height();
      messages.forEach((message) => {      
        $(`.chat-message[data-id=${message.id}]`).remove();
        $('.chat-container .speech-wrapper').append(pugChatMessage(message));
      });
      const heightNew = $('.chat-container .speech-wrapper').height();
      const heightDiff = heightNew - heightOld;
      
      this._sortMessages();
      
      $(`.chat-conversation-wrapper`).animate({
        scrollTop: this.initialLoad ? 5000 : heightDiff + marginTop - (marginTop - scrollTop)
      }, 0, "swing", () => {
        this.initialLoad = false;
        this.loading = false;
      });
    },
    
    _getLastMessageId: function () {
      return $(`.chat-container .speech-wrapper .chat-message`).last().attr('data-id');
    },
    
    _onWrapperScroll: function () {
      if (this.loading || !this.isActive()) {
        return;
      }
      
      const scrollTop = $(`.chat-conversation-wrapper`).scrollTop();
      if (scrollTop <= this.options.topScrollOffset) {
        this.loadMessages(++this.page);
      }      
    },
    
    _onChatCloseElementClick: function(event) {
      event.preventDefault();
      this.leaveThread();
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
    
    _onMessagesAdded: function (event, data) {
      this._addMessages(data.messages);
    }
    
  });
})();
