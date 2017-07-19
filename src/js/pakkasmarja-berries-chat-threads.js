/* jshint esversion: 6 */
/* global moment */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChatThreads", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create: function() {
      // TODO: Paging threads
      this.element.on('click', '.chat-thread', $.proxy(this._onChatThreadClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(document.body).on('message:conversation-threads-added', $.proxy(this._onThreadsAdded, this));
      $(document.body).on('message:conversations-unread', $.proxy(this._onConversationsUnread, this));
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
    },
    
    joinThread: function(threadId) {
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId);
    },
    
    _addThreads: function (threads) {
      const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
      
      $('.conversations-view').removeClass('loading');
      
      if (!threads.length) {
        $(`.questions-view ul`).html(pugNoThreads());
      } else {
        threads.forEach((thread) => {      
          $(`.chat-thread[data-id=${thread.id}]`).remove();

          const threadData = Object.assign(thread, {
            imageUrl: thread.imageUrl ? `${thread.imageUrl}?sessionId=${sessionId}` : 'gfx/placeholder.png',
            latestMessageFormatted: thread.latestMessage ? moment(thread.latestMessage).locale('fi').format('LLLL') : null
          });

          $('.conversations-view ul').append(pugChatThread(threadData));
        });
      }
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'conversations') {
        this._loadChatThreads();
        $('.menu-item[data-page="conversations"]').removeClass('unread');
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'mark-item-read',
          'id': 'conversations'
        });
      } else {
        $('.conversations-view ul').empty();
      }
    },
    
    _onChatThreadClick: function (event) {
      event.preventDefault();
      $("body").addClass("chat-conversation-open");
      const element = $(event.target).closest('.chat-thread');
      element.removeClass('unread').addClass('read');
      this.joinThread($(element).attr('data-id'));
    },
    
    _loadChatThreads: function () {
      $('.conversations-view ul').empty();
      $('.conversations-view').addClass('loading');
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-conversation-threads'
      });
    },
    
    _loadUnreadStatus: function () {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-conversations-unread-status'
      });
    },
    
    _onConnect: function (event, data) {
      this._loadUnreadStatus();
    },
    
    _onThreadsAdded: function (event, data) {
      this._addThreads(data.threads);
    },
    
    _onConversationsUnread: function (event, data) {
      $('.menu-item[data-page="conversations"]').addClass('unread');
    },
    
    _onMessagesAdded: function (event, data) {
      if ($(document.body).pakkasmarjaBerries('activePage') === 'conversations') {
        return;
      }
      
      if (data['thread-type'] === "conversation") {
        $('.menu-item[data-page="conversations"]').addClass('unread');  
      }
    }
    
  });
})();
