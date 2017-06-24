/* jshint esversion: 6 */
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesQuestionGroups", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create: function() {
      // TODO: Paging questionGroups
      this.selectedQuestionGroupId = null;
      this.element.on('click', '.question-group', $.proxy(this._onQuestionGroupClick, this));
      this.element.on('click', '.chat-question-group-thread', $.proxy(this._onChatQuestionGroupThreadClick, this));
      
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:question-groups-added', $.proxy(this._onQuestionGroupsAdded, this));
      $(document.body).on('message:question-thread-selected', $.proxy(this._onQuestionThreadSelected, this));
      $(document.body).on('message:question-group-threads-added', $.proxy(this._onQuestionGroupThreadsAdded, this));
    },
    
    selectQuestionGroup: function(questionGroupId, role) {
      if (role === 'user') {
        $(`.questions-view ul`).empty();
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'select-question-group-thread',
          'question-group-id': questionGroupId
        });
      } else if (role === 'manager') {
        this.selectedQuestionGroupId = questionGroupId;
        $(`.questions-view ul`).empty();
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'get-question-group-threads',
          'question-group-id': questionGroupId
        });
      } else {
        console.error(`Invalid question group role '${role}'`);
      }
    },
    
    _addQuestionGroups: function (questionGroups) {
      questionGroups.forEach((questionGroup) => {      
        $(`.question-group[data-id=${questionGroup.id}]`).remove();
        
        const questionGroupData = Object.assign(questionGroup, {
          imageUrl: questionGroup.imagePath ? this.options.serverUrl + questionGroup.imagePath : 'gfx/placeholder.png'
        });
        
        $(`.questions-view ul`).append(pugQuestionGroup(questionGroupData));
      });
    },
    
    _addQuestionGroupThreads: function (threads, questionGroupId) {
      if (this.selectedQuestionGroupId !== questionGroupId) {
        return;
      }
      
      threads.forEach((thread) => {      
        $(`.chat-question-group-thread[data-id=${thread.id}]`).remove();
        
        const threadData = Object.assign(thread, {
          imageUrl: thread.imagePath ? this.options.serverUrl + thread.imagePath : 'gfx/placeholder.png'
        });
        
        $('.questions-view ul').append(pugChatQuestionGroupThread(threadData));
      });
    },
    
    _onQuestionGroupClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.question-group');
      this.selectQuestionGroup($(element).attr('data-id'), $(element).attr('data-role'));
    },
    
    _onChatQuestionGroupThreadClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-question-group-thread');
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', $(element).attr('data-id'));
    },
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-question-groups'
      });
    },
    
    _onQuestionGroupsAdded: function (event, data) {
      this._addQuestionGroups(data['question-groups']);
    },
    
    _onQuestionThreadSelected: function (event, data) {
      const threadId = data['thread-id'];
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', threadId);
    },
    
    _onQuestionGroupThreadsAdded: function (event, data) {
      this._addQuestionGroupThreads(data['threads'], data['question-group-id']);
    }
    
  });
})();
