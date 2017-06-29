/* jshint esversion: 6 */
/* global moment */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesQuestionGroups", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create: function() {
      // TODO: Paging questionGroups
      this.reset();
      this.element.on('click', '.question-group', $.proxy(this._onQuestionGroupClick, this));
      this.element.on('click', '.chat-question-group-thread', $.proxy(this._onChatQuestionGroupThreadClick, this));
      
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(document.body).on('mainViewRestore', $.proxy(this._onMainViewRestore, this));      
      $(document.body).on('message:question-groups-added', $.proxy(this._onQuestionGroupsAdded, this));
      $(document.body).on('message:question-thread-selected', $.proxy(this._onQuestionThreadSelected, this));
      $(document.body).on('message:question-group-threads-added', $.proxy(this._onQuestionGroupThreadsAdded, this));
    },
    
    reset: function () {
      this.selectedQuestionGroupId = null;  
    },
    
    selectQuestionGroup: function(questionGroupId, role) {
      $('.questions-view').addClass('loading');
      $('.questions-view ul').empty();
        
      if (role === 'user') {
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'select-question-group-thread',
          'question-group-id': questionGroupId
        });
      } else if (role === 'manager') {
        $('.questions-view').addClass('question-group-threads');
        this.selectedQuestionGroupId = questionGroupId;
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'get-question-group-threads',
          'question-group-id': questionGroupId
        });
      } else {
        console.error(`Invalid question group role '${role}'`);
      }
    },
    
    _addQuestionGroups: function (questionGroups) {
      $('.questions-view').removeClass('loading');
      
      questionGroups.forEach((questionGroup) => {      
        $(`.question-group[data-id=${questionGroup.id}]`).remove();
        
        const questionGroupData = Object.assign(questionGroup, {
          imageUrl: questionGroup.imageUrl || 'gfx/placeholder.png',
          latestMessageFormatted: questionGroup.latestMessage ? moment(questionGroup.latestMessage).locale('fi').format('LLLL') : null
        });
        
        $(`.questions-view ul`).append(pugQuestionGroup(questionGroupData));
      });
    },
    
    _addQuestionGroupThreads: function (threads, questionGroupId) {
      if (this.selectedQuestionGroupId !== questionGroupId) {
        return;
      }
      
      $('.questions-view').removeClass('loading');
      
      threads.forEach((thread) => {      
        $(`.chat-question-group-thread[data-id=${thread.id}]`).remove();
        
        const threadData = Object.assign(thread, {
          imageUrl: thread.imageUrl || 'gfx/placeholder.png',
          latestMessageFormatted: thread.latestMessage ? moment(thread.latestMessage).locale('fi').format('LLLL') : null
        });
        
        $('.questions-view ul').append(pugChatQuestionGroupThread(threadData));
      });
    },
    
    _loadGroups: function () {
      this.reset();
      $('.questions-view ul').empty();
      $('.questions-view').addClass('loading');
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-question-groups'
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
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'questions') {
        this._loadGroups();
      } else {
        $('.questions-view ul').empty();
      }
    },
    
    _onMainViewRestore: function (event, data) {
      if (data.activePage === 'questions') {
        this._loadGroups();
      }
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
