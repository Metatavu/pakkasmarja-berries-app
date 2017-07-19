/* jshint esversion: 6 */

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
      if ($(".hamburger-menu").hasClass('menu-open')) {
        this._closeHamburgerMenu();
      } else if (this._checkBodyClass('chat-conversation-open')) {
        $(".chat-container").hide("slide", { direction: "right" }, 300);
        $(document.body).pakkasmarjaBerries('restoreMainView');
        this._removeBodyClass('chat-conversation-open');
      } else if (this._checkBodyClass('question-group-open')) {
        $(document.body).pakkasmarjaBerries('restoreMainView');
        this._removeBodyClass('question-group-open');
      } else if (this._checkBodyClass('question-group-thread-open')) {
        const questionGroupId = $("body").attr('question-group-id');
        $(".chat-container").hide("slide", { direction: "right" }, 300);
        this._restoreMainView(questionGroupId);
      } else {
        navigator.app.exitApp(); 
      } 
    },
    
    _restoreMainView(questionGroupId) {
      $('.swiper-slide, .secondary-menu, .navbar-top').show("slide", { direction: "left", complete: () => {
        $(document.body).pakkasmarjaBerriesQuestionGroups('selectQuestionGroup', questionGroupId, 'manager');
        this._removeBodyClass('question-group-thread-open');
        $("body").addClass('question-group-open');
      } }, 300);
    },
    
    _closeHamburgerMenu: function () {
      $(".hamburger-menu").removeClass('menu-open');
      $(".hamburger-menu").hide("slide", { direction: "right" }, 200);
    },
    
    _checkBodyClass: function (className) {
      return $("body").hasClass(className);
    },
    
    _removeBodyClass: function(className) {
      $("body").removeClass(className);
    }
    
  });
  
}).call(this);
