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
      $(document.body).pakkasmarjaBerries('back');
    }
    
  });
  
}).call(this);
