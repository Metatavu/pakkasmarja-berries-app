/* jshint esversion: 6 */
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesQuestionGroups", {
    
    options: {
      serverUrl: 'http://localhost:8000'
    },
    
    _create: function() {
      // TODO: Paging questionGroups
      this.element.on('click', '.question-group', $.proxy(this._onQuestionGroupClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:question-groups-added', $.proxy(this._onQuestionGroupsAdded, this));
      $(document.body).on('message:question-thread-selected', $.proxy(this._onQuestionThreadSelected, this));
    },
    
    selectQuestionGroup: function(questionGroupId, role) {
      if (role === 'user') {
        $(document.body).pakkasmarjaBerriesClient('sendMessage', {
          'type': 'select-question-group-thread',
          'question-group-id': questionGroupId
        });
      } else if (role === 'manager') {
        // TODO: List threads
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
    
    _onQuestionGroupClick: function(event) {
      event.preventDefault();
      const element = $(event.target).closest('.question-group');
      this.selectQuestionGroup($(element).attr('data-id'), $(element).attr('data-role'));
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
    }
    
  });
})();
