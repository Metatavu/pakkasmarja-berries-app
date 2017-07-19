/* jshint esversion: 6 */
/* global _, Promise */

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
      
      window.FirebasePlugin.subscribe('news');
    },
    
    _subscribeThreads: function (type, threads) {
      const subscribePromises = _.map(threads, (thread) => {
        return this._subscribeThread(type, thread);
      });
      
      return Promise.all(subscribePromises);
    },
    
    _subscribeThread: function (type, thread) {
      return this._subscribeTopic(thread)
        .then(() => {
          return $(document.body).pakkasmarjaBerriesDatabase('insertPushNotificationTopic', thread, type);
        });
    },
    
    _unsubscribeThreads: function (type, threads) {
      const unsubscribePromises = _.map(threads, (thread) => {
        return this._unsubscribeThread(type, thread);
      });
      
      return Promise.all(unsubscribePromises);
    },
    
    _unsubscribeThread: function (type, thread) {
      return this._unsubscribeTopic(thread)
        .then(() => {
          return $(document.body).pakkasmarjaBerriesDatabase('deletePushNotificationTopic', thread, type);
        });
    },
    
    _subscribeTopic: function (topic) {
      return new Promise((resolve, reject) => {
        window.FirebasePlugin.subscribe(topic);
        resolve();
      });
    },
    
    _unsubscribeTopic: function (topic) {
      return new Promise((resolve, reject) => {
        window.FirebasePlugin.unsubscribe(topic);
        resolve();
      });
    },
    
    _updateThreadSubscriptions: function (type, threads) {
      return $(document.body).pakkasmarjaBerriesDatabase('listPushNotificationTopicsByType', type)
        .then((subscribedThreads) => {
          const subscribeThreads = [];
          const unsubscribeThreads = [];
          
          _.forEach(threads, (thread) => {
            if (_.indexOf(subscribedThreads, thread) < 0) {
              subscribeThreads.push(thread);
            }
          });
          
          _.forEach(subscribedThreads, (subscribedThread) => {
            if (_.indexOf(threads, subscribedThread) < 0) {
              unsubscribeThreads.push(subscribedThread);
            }
          });
          
          return Promise.all(this._subscribeThreads(type, subscribeThreads), this._unsubscribeThreads(type, unsubscribeThreads));
        });
    },
    
    _onSubscribableQuestionGroupThreadsFound: function (event, data) {
      const threads = _.map(data['thread-ids']||[], (threadId) => {
        return `question-group-thread-${threadId}`;
      });
      
      this._updateThreadSubscriptions('question', threads)
        .then(() => {
          if (this.options.logDebug) {
            console.log("Question group thread subscriptions updated successfully");
          }
        })
        .catch((err) => {
          if (this.options.logDebug) {
            console.error(`Question group thread subscriptions update failed on ${err}`);
          }
        });
    },
    
    _onSubscribableConversationThreadsFound: function (event, data) {
      const threads = _.map(data['thread-ids']||[], (threadId) => {
        return `conversation-thread-${threadId}`;
      });
      
      this._updateThreadSubscriptions('conversation', threads)
        .then(() => {
          if (this.options.logDebug) {
            console.log("Conversation thread subscriptions updated successfully");
          }
        })
        .catch((err) => {
          if (this.options.logDebug) {
            console.error(`Conversation thread subscriptions update failed on ${err}`);
          }
        });
    }
    
  });
  
}).call(this);