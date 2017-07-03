/* jshint esversion: 6 */
/* global FCMPlugin */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesPushNotifications", {
    
    options: {
      logDebug: true
    },
    
    _create : function() {
      $(document.body).on('message:subscribable-question-group-threads-found', $.proxy(this._onSubscribableQuestionGroupThreadsFound, this));
      $(document.body).on('message:subscribable-conversation-threads-found', $.proxy(this._onSubscribableConversationThreadsFound, this));

      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-subscribable-conversation-threads'
      });
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-subscribable-question-group-threads'
      });
      
      FCMPlugin.subscribeToTopic('news', $.proxy(this._onNewsSubscribeSuccess, this), $.proxy(this._onNewsSubscribeFailure, this));
    },
    
    _onNewsSubscribeSuccess: function (message) {
      if (this.options.logDebug) {
        console.log("Subscribed to topic news succesfully", message);
      }
    },
    
    _onNewsSubscribeFailure: function (err) {
      if (this.options.logDebug) {
        console.error("Could not subscribe to topic news", err);
      }
    },
    
    _onSubscribableQuestionGroupThreadsFound: function (event, data) {
      let threads = [];
      this.questionGroupThreads = data['thread-ids'];
      
      this.questionGroupThreads.forEach((thread) => {
        threads.push(`question-group-thread-${thread}`);
        
        $(document.body).pakkasmarjaBerriesDatabase('findItem', `question-group-thread-${thread}`)
          .then((item) => {
            if (!item.length) {
              $(document.body).pakkasmarjaBerriesDatabase('insertPushNotificationTopic', `question-group-thread-${thread}`);
              FCMPlugin.subscribeToTopic(`question-group-thread-${thread}`, $.proxy(this._onSubscribeSuccess, this), $.proxy(this._onSubscribeFailure, this));
            } else if (item && item.length) {
              FCMPlugin.subscribeToTopic(`question-group-thread-${thread}`, $.proxy(this._onSubscribeSuccess, this), $.proxy(this._onSubscribeFailure, this));
            }
          })
          .catch(this.handleError);
        
        $(document.body).pakkasmarjaBerriesDatabase('deleteNotSubscribedPushNotificationTopics', threads);
        
      });
    },
    
    _onSubscribableConversationThreadsFound: function (event, data) {
      let threads = [];
      this.conversationGroupThreads = data['thread-ids'];
      console.log("conv " + this.conversationGroupThreads);
      
      this.conversationGroupThreads.forEach((thread) => {
        threads.push(`conversation-thread-${thread}`);
        
        $(document.body).pakkasmarjaBerriesDatabase('findItem', `conversation-thread-${thread}`)
          .then((item) => {
            if (!item) {
              $(document.body).pakkasmarjaBerriesDatabase('insertPushNotificationTopic', `question-group-thread-${thread}`);
              FCMPlugin.subscribeToTopic(`question-group-thread-${thread}`, $.proxy(this._onSubscribeSuccess, this), $.proxy(this._onSubscribeFailure, this));
            } else if (item) {
              FCMPlugin.subscribeToTopic(`question-group-thread-${thread}`, $.proxy(this._onSubscribeSuccess, this), $.proxy(this._onSubscribeFailure, this));
            }
          })
          .catch(this.handleError);
        
        $(document.body).pakkasmarjaBerriesDatabase('deleteNotSubscribedPushNotificationTopics', threads);
        
      });
    },
    
    _onSubscribeSuccess: function () {
      if (this.options.logDebug) {
        console.log("Subscribed topic successfully");
      }
    },
    
    _onSubscribeFailure: function () {
      if (this.options.logDebug) {
        console.log("Error while subscribing topic");
      }
    },
    
    _onUnsubscribeSuccess: function () {
      if (this.options.logDebug) {
        console.log("Unsubscribed topic successfully");
      }
    },
    
    _onUnubscribeFailure: function () {
      if (this.options.logDebug) {
        console.log("Error while unsubscribing topic");
      }
    }
    
  });
  
}).call(this);