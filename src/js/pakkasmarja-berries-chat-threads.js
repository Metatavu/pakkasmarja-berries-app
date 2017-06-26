/* jshint esversion: 6 */
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
      $(document.body).on('message:conversation-threads-added', $.proxy(this._onThreadsAdded, this));
    },
    
    joinThread: function(threadId) {
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId);
    },
    
    _addThreads: function (threads) {
      threads.forEach((thread) => {      
        $(`.chat-thread[data-id=${thread.id}]`).remove();
        
        const threadData = Object.assign(thread, {
          imageUrl: thread.imageUrl || 'gfx/placeholder.png'
        });
        
        $('.conversations-view ul').append(pugChatThread(threadData));
      });
    },
    
    _onChatThreadClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-thread');
      this.joinThread($(element).attr('data-id'));
    },
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-conversation-threads'
      });
    },
    
    _onThreadsAdded: function (event, data) {
      this._addThreads(data.threads);
    }
    
  });
})();
