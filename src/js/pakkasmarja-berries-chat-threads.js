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
    
    joinThread: function(threadId, threadTitle, threadLogo) {
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId, threadTitle, threadLogo, 'Keskustelu');
    },
    
    _addThreads: function (threads) {
      const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
      
      $('.conversations-view').removeClass('loading');
      
      if (!threads.length) {
        $('.conversations-view ul').html(pugNoConversationThreads());
      } else {
        threads.forEach((thread) => {
          const threadData = Object.assign(thread, {
            imageUrl: thread.imageUrl ? `${thread.imageUrl}?sessionId=${sessionId}` : 'gfx/placeholder.png',
            latestMessageFormatted: thread.latestMessage ? moment(thread.latestMessage).locale('fi').format('LLLL') : null
          });

          if ($(`.chat-thread[data-id=${thread.id}]`).length) {
            if (!threadData.latestMessage) {
              let prevLatestMessage = $(`.chat-thread[data-id=${thread.id}]`).attr('data-latest-message');
              if (prevLatestMessage) {
                threadData.latestMessage = prevLatestMessage;
                threadData.latestMessageFormatted = moment(prevLatestMessage).locale('fi').format('LLLL');
              }
            }
            if(typeof threadData.read === 'undefined') {
              threadData.read = $(`.chat-thread[data-id=${thread.id}]`).hasClass('read');
            }
            $(`.chat-thread[data-id=${thread.id}]`).replaceWith(pugChatThread(threadData));
          } else {
            $('.conversations-view ul').append(pugChatThread(threadData));
          }
          
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
      }
    },
    
    _onChatThreadClick: function (event) {
      event.preventDefault();
      if ('browser' === device.platform) {
        $('.item-row').removeClass('active');
        $(event.target).closest('.item-row').addClass('active');
      }
      
      $("body").addClass("chat-conversation-open");
      const element = $(event.target).closest('.chat-thread');
      element.removeClass('unread').addClass('read');
      
      const threadId = $(element).attr('data-id');
      const threadTitle = $(element).attr('data-thread-title');
      const threadImage = $(element).attr('data-thread-image');
      
      this.joinThread(threadId, threadTitle, threadImage);
    },
    
    _loadChatThreads: function () {
      if ($('.conversations-view ul').is(':empty')) {
        $('.conversations-view').addClass('loading');
      }
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
