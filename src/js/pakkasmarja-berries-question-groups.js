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
    },
    
    selectQuestionGroup: function(questionGroupId) {
      // TODO: List or switch to thread
      
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
      this.selectQuestionGroup($(element).attr('data-id'));
    },
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-question-groups'
      });
    },
    
    _onQuestionGroupsAdded: function (event, data) {
      this._addQuestionGroups(data['question-groups']);
    }
    
  });
})();
