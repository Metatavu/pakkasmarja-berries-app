/* jshint esversion: 6 */
/* global window, document, WebSocket, MozWebSocket, $, _*/
(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesDatabase", {
    
    options: {
      drop: false
    },
    
    _create : function() {
      this.prepareDatabase()
        .then(() => {
          window.sqlitePlugin.openDatabase({ name: 'pakkasmarja-push-notifications.db', location: 'default' }, (db) => {
            this.db = db;
            this.initializeDatabase();
            $(document.body).trigger("databaseOpen");
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },
    
    prepareDatabase: function () {
      return new Promise((resolve, reject) => {
        if (this.options.drop) {
          window.sqlitePlugin.deleteDatabase({ name: 'pakkasmarja-push-notifications.db', location: 'default' }, () => {
            console.log("db dropped");
            resolve();
          }, (err) => {
            reject(err);
          });
        } else {
          resolve();
        }
      });
    },
    
    initializeDatabase: function() {
      this.executeTx('CREATE TABLE IF NOT EXISTS PushNotificationTopics (topic)')
        .then(() => {
          console.log("db Initialized");
          $(document.body).trigger("databaseInitialized");
        })
        .catch(this.handleError);
    },
    
    handleError: function(error) {
      console.error(error);
    },
    
    executeTx(sql, params) {
      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          tx.executeSql(sql, params, (tx, rs) => {
            resolve(rs);
          }, (tx, error) => {
            reject(error);
          });
        }, (error) => {
          reject('Transaction ERROR: ' + error.message);
        }, () => {
        });
      });
    },
    
    insertPushNotificationTopic: function (topic) {
      return new Promise((resolve, reject) => {
        this.executeTx('INSERT INTO PushNotificationTopics (topic) values (?)', [topic])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    findItem: function(topic) {
      return new Promise((resolve, reject) => {
        this.executeTx('SELECT * from PushNotificationTopics where topic = ?', [topic])
          .then((rs) => {
            if (rs.rows && rs.rows.length > 0) {
              const row = rs.rows.item(0);
              resolve(row.topic);
            } else {
              resolve(null);
            }
          })
          .catch(reject);
      });
    },
    
    deleteNotSubscribedPushNotificationTopics: function (threads) {
      return new Promise((resolve, reject) => {
        this.executeTx('DELETE (topic) FROM PushNotificationTopics WHERE topic NOT IN (?)', [threads])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    }
    
  });
  
  
}).call(this);