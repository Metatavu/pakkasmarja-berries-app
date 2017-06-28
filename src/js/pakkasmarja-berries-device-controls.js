/* jshint esversion: 6 */
/* global FCMPlugin */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesDeviceControls", {
    
    options: {
      logDebug: false
    },
    
    _create : function() {
      document.addEventListener("backbutton", $.proxy(this._onBackButtonClick, this), false);
    },
    
    selectedQuestionGroupId: function (selectedQuestionGroupId) {
      this.selectedQuestionGroupId = selectedQuestionGroupId;
    },
    
    userRole: function (role) {
      this.userRole = role;
    },
    
    _onBackButtonClick: function (event) {
      if ($(".chat-container").hasClass("chat-conversation-open")) {
        $(".chat-container").pakkasmarjaBerriesChatThread('leaveThread');
        $('.questions-view').removeClass("question-group-threads");
      } else if ($(".news-wrapper").hasClass("news-article-open")) {
        $(".news-wrapper").removeClass("news-article-open");
        $(document.body).pakkasmarjaBerriesNews("closeNews");
      } else if ($('.questions-view').hasClass('question-group-threads')) {
        $('.questions-view').removeClass("question-group-threads");
        $(document.body).pakkasmarjaBerries("updateSwiper", 2);
        $(document.body).pakkasmarjaBerries('restoreMainView');
      } else {
        $(document.body).pakkasmarjaBerries("updateSwiper", 0); 
      }
    }
    
  });
  
}).call(this);
