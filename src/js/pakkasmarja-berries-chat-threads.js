/* jshint esversion: 6 */
/* global moment, device */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChatThreads", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create: function() {
      // TODO: Paging threads
      this.loadingClassByPlatform = device.platform.toLowerCase() === 'ios' ? 'loading-ios' : 'loading';
      this.element.on('click', '.chat-thread', $.proxy(this._onChatThreadClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(document.body).on('message:conversation-threads-added', $.proxy(this._onThreadsAdded, this));
    },
    
    joinThread: function(threadId) {
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId);
    },
    
    _addThreads: function (threads) {
      $('.conversations-view').removeClass(this.loadingClassByPlatform);
      threads.forEach((thread) => {      
        $(`.chat-thread[data-id=${thread.id}]`).remove();
        
        const threadData = Object.assign(thread, {
          imageUrl: thread.imageUrl || 'gfx/placeholder.png',
          latestMessageFormatted: thread.latestMessage ? moment(thread.latestMessage).locale('fi').format('LLLL') : null
        });
        
        $('.conversations-view ul').append(pugChatThread(threadData));
      });
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'conversations') {
        this._loadChatThreads();
      } else {
        $('.conversations-view ul').empty();
      }
    },
    
    _onChatThreadClick: function (event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-thread');
      this.joinThread($(element).attr('data-id'));
    },
    
    _loadChatThreads: function () {
      $('.conversations-view ul').empty();
      $('.conversations-view').addClass(this.loadingClassByPlatform);
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-conversation-threads'
      });
    },
    
    _onConnect: function (event, data) {
      this._loadChatThreads();
    },
    
    _onThreadsAdded: function (event, data) {
      this._addThreads(data.threads);
    }
    
  });
})();
