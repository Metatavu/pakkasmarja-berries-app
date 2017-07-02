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
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('pageChange', $.proxy(this._onPageChange, this));
      $(document.body).on('mainViewRestore', $.proxy(this._onMainViewRestore, this));      
      $(document.body).on('message:question-groups-added', $.proxy(this._onQuestionGroupsAdded, this));
      $(document.body).on('message:question-thread-selected', $.proxy(this._onQuestionThreadSelected, this));
      $(document.body).on('message:question-group-threads-added', $.proxy(this._onQuestionGroupThreadsAdded, this));
      $(document.body).on('message:questions-unread', $.proxy(this._onQuestionsUnread, this));
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
    },
    
    reset: function () {
      this.selectedQuestionGroupId = null;  
    },
    
    selectQuestionGroup: function(questionGroupId, role) {
      $('.questions-view').addClass('loading');
      $('.questions-view ul').empty();
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'mark-item-read',
        'id': `question-group-${questionGroupId}`
      });
        
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
      const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
      
      $('.questions-view').removeClass('loading');
      
      questionGroups.forEach((questionGroup) => {      
        $(`.question-group[data-id=${questionGroup.id}]`).remove();
        
        const questionGroupData = Object.assign(questionGroup, {
          imageUrl: questionGroup.imageUrl ? `${questionGroup.imageUrl}?sessionId=${sessionId}` : 'gfx/placeholder.png',
          latestMessageFormatted: questionGroup.latestMessage ? moment(questionGroup.latestMessage).locale('fi').format('LLLL') : null
        });
        
        $(`.questions-view ul`).append(pugQuestionGroup(questionGroupData));
      });
    },
    
    _addQuestionGroupThreads: function (threads, questionGroupId) {
      if (parseInt(this.selectedQuestionGroupId) !== parseInt(questionGroupId)) {
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
    
    _loadUnreadStatus: function () {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-questions-unread-status'
      });
    },
    
    _onQuestionGroupClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.question-group');
      element.removeClass('unread').addClass('read');
      this.selectQuestionGroup($(element).attr('data-id'), $(element).attr('data-role'));
    },
    
    _onChatQuestionGroupThreadClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.chat-question-group-thread');
      element.removeClass('unread').addClass('read');
      $(".chat-container").pakkasmarjaBerriesChatThread('joinThread', $(element).attr('data-id'));
    },
    
    _onPageChange: function (event, data) {
      if (data.activePage === 'questions') {
        this._loadGroups();
        $('.menu-item[data-page="questions"]').removeClass('unread');
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'mark-item-read',
          'id': 'questions'
        });
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
    
    _onConnect: function (event, data) {
      this._loadUnreadStatus();
    },
    
    _onQuestionGroupThreadsAdded: function (event, data) {
      this._addQuestionGroupThreads(data['threads'], data['question-group-id']);
    },
    
    _onQuestionsUnread: function (event, data) {
      $('.menu-item[data-page="questions"]').addClass('unread');
    },
    
    _onMessagesAdded: function (event, data) {
      if ($(document.body).pakkasmarjaBerries('activePage') === 'questions') {
        return;
      }
      
      if (data['thread-type'] === "question") {
        $('.menu-item[data-page="questions"]').addClass('unread');  
      }
    }
    
  });
})();
