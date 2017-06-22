/* jshint esversion: 6 */
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChatThreads", {
    
    options: {
    },
    
    _create: function() {
      // TODO: Paging threads
      this.element.on('click', '.chat-thread', $.proxy(this._onChatThreadClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:threads-added', $.proxy(this._onThreadsAdded, this));
    },
    
    joinThread: function(threadId) {
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId);
    },
    
    _addThreads: function (threads) {
      threads.forEach((thread) => {      
        const categorySelector = thread.type === 'conversation' ? '.conversations-view' : '.questions-view';  
        $(`.chat-thread[data-id=${thread.id}]`).remove();
        $(`${categorySelector} ul`).append(pugChatThread(thread));
      });
    },
    
    _onChatThreadClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-thread');
      
      this.joinThread($(element).attr('data-id'));
    },
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-threads',
        'thread-type': 'conversation'
      });
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-threads',
        'thread-type': 'question'
      });
    },
    
    _onThreadsAdded: function (event, data) {
      this._addThreads(data.threads);
    }
    
  });
})();
