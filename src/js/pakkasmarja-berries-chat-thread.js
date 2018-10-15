/* jshint esversion: 6 */
/* global Camera, autosize, device */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesChatThread", {
    
    options: {
      messagesLimit: 7,
      topScrollOffset: 150,
      logDebug: false,
      serverUrl: 'http://localhost:8000',      
      imageTargetHeight: 1000,
      imageTargetWidth: 1000
    },
    
    _create: function() {
      this.reset();
      this.element.on('click', '.chat-close-btn', $.proxy(this._onChatCloseElementClick, this));
      this.element.on('keydown', '.message-input', $.proxy(this._onMessageInputClick, this));
      this.element.on('click', '.message-send-btn', $.proxy(this._onMessageSendButtonClick, this));
      this.element.on('click', '.upload-image', $.proxy(this._onUploadImageClick, this));
      this.element.on('click', '.image-gallery', $.proxy(this._onImageFromGallery, this));
      this.element.on('click', '.image-camera', $.proxy(this._onImageFromCamera, this));
      this.element.on('click', '.close-dialog', $.proxy(this._onCloseDialogClick, this));
      this.element.on('click', '.full-image-btn', $.proxy(this._onFullImageBtnClick, this));
      this.element.on('click', '.remove-message-btn', $.proxy(this._onRemoveMessageBtnClick, this));
      this.element.on('click', '.chat-conversation-poll li', $.proxy(this._onChatConversationPollClick, this));
      this.element.on('change', '.poll-item-other input', $.proxy(this._onChatConversationPollOtherChange, this));


      $(document.body).on('click', '.chat-container .list-header-close-btn', $.proxy(this._onHeaderBackButtonClick, this));
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
      $(document.body).on('message:message-deleted', $.proxy(this._onMessageDeleted, this));
      this.element.find('.chat-conversation-wrapper').on('scroll' ,$.proxy(this._onWrapperScroll, this));

      autosize($('.message-input'));
      this.element.find('.message-input').on('autosize:resized', $.proxy(this._onAutosizeResized, this));
    },
    
    _onAutosizeResized: function() {
      if (this.answerType !== "POLL") {
        const inputHeight = this.element.find('.message-input').outerHeight();
        $('.chat-footer').height(inputHeight);
      }
    },
    
    reset: function () {
      this.answerType = "TEXT";
      this.activeThreadId = null;
      this.morePages = true;
      this.loading = false;
      this.sending = false;
      this.initialLoad = true;
      this.page = 0;
      this.predefinedTexts = [];
    },
    
    joinThread: function (threadId, threadTitle, threadDescription, threadImageUrl, threadCategory, answerType, predefinedTexts, allowOtherAnswer) {
      this.reset();
      
      this.activeThreadId = parseInt(threadId);
      this.answerType = answerType;
      this.predefinedTexts = predefinedTexts;
      this.element.find('.message-input').val('');

      $(`.chat-container .speech-wrapper`).empty();
      if ('browser' !== device.platform) {
        $(".swiper-slide, .secondary-menu").hide("slide", { direction: "left" }, 300);      
        $(".chat-container").show("slide", { direction: "right" }, 300);
      }
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'mark-item-read',
        'id': `thread-${threadId}`
      });
      
      if (answerType === "POLL") {
        $(".chat-conversation-poll")
          .html(threadDescription)
          .show();
        $(".chat-conversation-wrapper").hide();

        const optionsContainer = $("<ul>")
          .appendTo($(".chat-conversation-poll"));

        for (let i = 0; i < this.predefinedTexts.length; i++) {
          this._appendTextPollItem(optionsContainer, this.predefinedTexts[i]);
        }

        if (allowOtherAnswer) {
          this._appendOtherPollItem(optionsContainer);
        }

        $('.chat-footer')
          .removeClass('chat-footer-text')
          .addClass('chat-footer-poll');

      } else {
        $(".chat-conversation-poll").hide();
        $(".chat-conversation-wrapper").show();

        this.loadMessages(this.page);
        
        $('.chat-container .list-header-name').text(threadTitle || 'Pakkasmarja');
        $('.chat-container .list-header-logo').attr('src', threadImageUrl || 'gfx/logo_punainen.png');
        $('.chat-container .list-header-category').text(threadCategory || '');

        $('.chat-footer')
          .addClass('chat-footer-text')
          .removeClass('chat-footer-poll');
      }
    },

    leaveThread: function() {
      this.activeThreadId = null;
      if ('browser' !== device.platform) {
        $(".chat-container").hide("slide", { direction: "right" }, 300);
      }
      
      $(document.body).pakkasmarjaBerries('restoreMainView');
    },
      
    loadMessages: function (page) {
      if (!this.morePages) {
        return;  
      }

      this.loading = true;
      $(`.chat-container .speech-wrapper`).addClass('loading');
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-messages',
        'thread-id': this.activeThreadId,
        "max-results": this.options.messagesLimit,
        'first-result': page * this.options.messagesLimit
      });
    },
    
    isActive: function () {
      if (!this.activeThreadId) {
        return false;
      }

      return $(document.body).pakkasmarjaBerries('activePage') === 'conversations' || $(document.body).pakkasmarjaBerries('activePage') === 'questions';
    },

    /**
     * Appends new text poll item into options container
     * 
     * @param {jQuery} optionsContainer options container
     * @param {String} text label text
     */
    _appendTextPollItem(optionsContainer, text) {
      this._appendPollItem(optionsContainer, "hidden", text, text)
        .addClass("poll-item-text");
    },

    /**
     * Appends new other poll item into options container
     * 
     * @param {jQuery} optionsContainer options container
     */
    _appendOtherPollItem(optionsContainer) {
      this._appendPollItem(optionsContainer, "text", "Jokin muu: ", "")
        .addClass("poll-item-other");
    },

    /**
     * Appends new poll item into options container
     * 
     * @param {jQuery} optionsContainer options container
     * @param {String} type input type 
     * @param {String} text label text
     * @param {String} value input value
     */
    _appendPollItem(optionsContainer, type, text, value) {
      const input = $("<input>")
        .attr({
          "type": type
        })
        .val(value);

      return $("<li>")
        .append($("<span>").text(text).append(input))
        .appendTo(optionsContainer);
    },

    /**
     * Event handler for listening poll list clicks
     * 
     * @param {Object} e event
     */
    _onChatConversationPollClick: function (e) {
      const li = $(e.target).closest("li");
      const value = li.find('input').val();
      $(".message-input").val(value);
      $(".poll-item-selected").removeClass("poll-item-selected");
      li.addClass("poll-item-selected");
    },

    /**
     * Event handler for listening poll other input change event
     * 
     * @param {Object} e event
     */
    _onChatConversationPollOtherChange: function (e) {
      const li = $(e.target).closest("li");
      const value = li.find('input').val();
      $(".message-input").val(value);
      $(".poll-item-selected").removeClass("poll-item-selected");
      li.addClass("poll-item-selected");
    },

    _onRemoveMessageBtnClick: function(e) {
      e.preventDefault();
      
      const messageId = $(e.target).closest('.chat-message').attr('data-id');
      if (!messageId) {
        return;
      }
      navigator.notification.confirm('Halutko varmasti poistaa tämän viestin. Huomaa että viesti poistuu PYSYVÄSTI!', (buttonIndex) => {
        if (buttonIndex === 1) {
          this._removeMessage(messageId);
        }
      }, 'Oletko varma?', ['Kyllä', 'Peruuta']);
    },
    
    _removeMessage: function(messageId) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'delete-message',
        'id': messageId
      });
    },
    
    _onFullImageBtnClick: function(e) {
      e.preventDefault();
      const sourceUrl = $(e.target).closest('.full-image-btn').attr('data-source-url');
      PhotoViewer.show(sourceUrl, '', { share:false });
      //TODO: use local image
    },
    
    _downloadImage: function(url, hash) {
      return new Promise((resolve, reject) => {
        const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
        const fileTransfer = new FileTransfer();
        fileTransfer.download(`${url}?sessionId=${sessionId}`, `cdvfile://localhost/temporary/pakkasmarja-images/${hash}.jpg`, (entry) => {
          const targetPath= entry.toURL();
          cordova.plugins.photoLibrary.saveImage(targetPath, 'pakkasmarja', resolve, (err) => {
            reject(err);
          });
        }, (downloadErr) => {
          reject(downloadErr);
        });
      });

    },
    
    _getImageFromGallery: function(libraryItemOrId) {
      return new Promise((resolve, reject) => {
        cordova.plugins.photoLibrary.getThumbnailURL(
          libraryItemOrId,
          (thumbnailURL) => {
            cordova.plugins.photoLibrary.getPhotoURL(
            libraryItemOrId,
             (photoURL) => {
               resolve({
                 thumb: thumbnailURL,
                 full: photoURL,
                 imageId: typeof libraryItemOrId.id !== 'undefined' ? libraryItemOrId.id : libraryItemOrId
               });
            }, reject);
          }, reject);
      });
    },
    
    _processMessageImage: function(image) {
      return new Promise((resolve, reject) => {
        const src = $(image).attr('data-src');
        const srcHash = $(image).attr('data-src-hash');
        $(image).removeAttr('data-src-hash');
        const imageId =  window.localStorage.getItem(srcHash);
        if (imageId) {
          this._getImageFromGallery(imageId)
            .then((imageData) => {
              if (!imageData) {
                window.localStorage.removeItem(srcHash);
                return this._processMessageImage(image);
              } else {
                resolve(imageData); 
              }
            })
            .catch((err) => {
              window.localStorage.removeItem(srcHash);
              return this._processMessageImage(image);
            });
        } else {
          this._downloadImage(src, srcHash)
            .then((imageItem) => {
              window.localStorage.setItem(srcHash, imageItem.id);
              this._getImageFromGallery(imageItem)
                .then((imageData) => { resolve(imageData) });
            })
            .catch(reject);
        }
      });
    },
    
    _processMessage: function(message) {
      return new Promise((resolve, reject) => {
          const imagesToLoad = $('.chat-container .speech-wrapper').find('img[data-src-hash]');
          const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
          async.each(imagesToLoad, (image, callback) => {
            this._processMessageImage(image)
              .then((imageData) => {
                $(image).attr('src', imageData.thumb);
                const originalSrc = $(image).attr('data-src');
                const sourceUrl = `${originalSrc}?sessionId=${sessionId}`
                $(image).wrap(`<a data-source-url="${sourceUrl}" data-image-id="${imageData.imageId}" class='full-image-btn' href="${imageData.full}"></a>`);
                callback();
              })
              .catch((err) => { callback(err) });
          }, (err) => {
            if (err) {
              console.log('error loading image', err);
              reject(err);
            } else {
              resolve();
            }
          });
      });
    },
    
    _sortMessages: function () {
      $('.speech-wrapper .chat-message').sort((newsItem1, newsItem2) => {
        const created1 = moment($(newsItem1).attr('data-created'));
        const created2 = moment($(newsItem2).attr('data-created'));
        return created1.diff(created2);
      }).appendTo('.speech-wrapper');
    },
    
    _addMessages: function (threadId, messages) {
      if (this.activeThreadId !== threadId) {
        return;
      }
      
      const canRemove = $(document.body).pakkasmarjaBerriesAuth('isAppManager');
      const scrollTop = $(`.chat-conversation-wrapper`).scrollTop();
      const marginTop = 120;
      const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
      
      $('.chat-container .speech-wrapper').removeClass('loading sending');
      
      const heightOld = $('.chat-container .speech-wrapper').height();
      
      messages.forEach((message) => {
        if (this.activeThreadId === message.threadId) {
          $(`.chat-message[data-id=${message.id}]`).remove();
          
          const messageHtml = $(pugChatMessage({message:  message, canRemove: canRemove }));
          const sessionId = $(document.body).pakkasmarjaBerriesAuth('sessionId');
          messageHtml.find('img').each((index, image) => {
            const src = $(image).attr('src');
            
            if ('browser' === device.platform) {
              $(image).attr('src', `${src}?sessionId=${sessionId}`);
              $(image).wrap(`<a href="${src}?sessionId=${sessionId}" target='_blank'></a>`);
            } else {
              const srcHash = md5(src);
              $(image).attr('src',  'gfx/ring.gif');
              $(image).attr('data-src',  src);
              $(image).attr('data-src-hash',  srcHash);
            }
          });
          
          $('.chat-container .speech-wrapper').append(messageHtml);
          if ('browser' !== device.platform) {
            this._processMessage(message)
              .then(() => { })
              .catch((err) => { console.log(err); });
          }
        }
      });
      
      if (messages.length < this.options.messagesLimit) {
        this.morePages = false;
      }
      
      const heightNew = $('.chat-container .speech-wrapper').height();
      const heightDiff = heightNew - heightOld;
      
      this._sortMessages();
      
      $(`.chat-conversation-wrapper`).animate({
        scrollTop: this.initialLoad || this.sending ? heightNew : heightDiff + marginTop - (marginTop - scrollTop)
      }, 0, "swing", () => {
        if (this.answerType === "POLL" && this.sending) {
          new Noty({ 
            text: "Viesti lähetetty, voit muokata vastaustasi lähettämällä uuden vastauksen",
            type: "info",
            timeout: 3000,
            layout: "center" 
          }).show();
        }

        this.initialLoad = false;
        this.loading = false;
        this.sending = false;
      });
    },
    
    _getLastMessageId: function () {
      return $(`.chat-container .speech-wrapper .chat-message`).last().attr('data-id');
    },
    
    _prepareSendMessage: function () {
      this.sending = true;
      
      $(`.chat-container .speech-wrapper`).addClass('sending');
      
      $(`.chat-conversation-wrapper`).animate({
        scrollTop: $('.chat-container .speech-wrapper').height()
      }, 200);
      
      $('.message-input').val('').blur();
      autosize.update($('.message-input'));
    },
    
    sendMessage: function (content) {
      this._prepareSendMessage();

      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'send-message',
        'threadId': this.activeThreadId,
        'contents': content
      });

      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'mark-item-read',
        'id': `message-${this.activeThreadId}`
      });
    },
    
    _onWrapperScroll: function () {
      if (this.sending || this.loading || !this.isActive()) {
        return;
      }
      
      const scrollTop = $(`.chat-conversation-wrapper`).scrollTop();
      if (scrollTop <= this.options.topScrollOffset) {
        this.loadMessages(++this.page);
      }
    },
    
    _onChatCloseElementClick: function(event) {
      event.preventDefault();
      this.leaveThread();
    },
    
    _onUploadImageClick: function (event) {
      event.preventDefault();
      
      $(".modal").show();
    },
    
    _onCloseDialogClick: function () {
      $(".modal").hide();
    },
    
    _onImageFromGallery: function() {
      $(".modal").hide();
      navigator.camera.getPicture($.proxy(this._onCapturePhoto, this), $.proxy(this._onCapturePhotoFail, this), {
        quality: 90,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
        correctOrientation: true,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        targetHeight: this.options.imageTargetHeight,
        targetWidth: this.options.imageTargetWidth
      });
    },
    
    _onImageFromCamera: function() {
      $(".modal").hide();
      navigator.camera.getPicture($.proxy(this._onCapturePhoto, this), $.proxy(this._onCapturePhotoFail, this), {
        quality: 90,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: navigator.camera.PictureSourceType.CAMERA,
        correctOrientation: true,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        targetHeight: this.options.imageTargetHeight,
        targetWidth: this.options.imageTargetWidth
      });
    },
    
    _onCapturePhoto: function (fileURI) {
      this._prepareSendMessage();
      
      const options = new FileUploadOptions();
      const fileTransfer = new FileTransfer();
      
      options.fileKey = "image";
      options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
      options.mimeType = "image/jpeg";
      options.params = {
        threadId: this.activeThreadId,
        sessionId: $(document.body).pakkasmarjaBerriesAuth('sessionId')
      };

      fileTransfer.upload(fileURI, encodeURI(`${this.options.serverUrl}/images/upload/message`), $.proxy(this._onUploadSuccess, this), $.proxy(this._onUploadFailure, this), options);
    },
    
    _onUploadSuccess: function (res) {
      navigator.camera.cleanup();
    },
    
    _onUploadFailure: function (message) {
      if (this.options.logDebug) {
        console.error(`Image upload failed on ${message}`);
      }
    },
    
    _onCapturePhotoFail: function (message) {
      if (this.options.logDebug) {
        console.error(`Capture failed on ${message}`);
      }
    },
    
    _onMessageInputClick: function (event) {
      if (event.which === 13) {
        const input = $(event.target);
        const content = input.val();
        if (content) {
          this.sendMessage(content);
        }
      }
    },
    
    _onMessageSendButtonClick: function () {
      const input = $('.message-input');
      const content = input.val();
      if (content) {
        this.sendMessage(content);
      }
    },
    
    _onMessagesAdded: function (event, data) {
      data.messages.forEach((message) => {
        const created = moment(new Date(message.created));
        message.sent = created.format('DD.M.YYYY HH:mm');
      });
      this._addMessages(data['thread-id'], data['messages']);
    },
    
    _onMessageDeleted: function (event, data) {
      const messageId = data.messageId;
      $(`.chat-message[data-id="${messageId}"]`).remove();
    },
    
    _onHeaderBackButtonClick: function (event) {
      event.preventDefault();
      $(document.body).pakkasmarjaBerries('back');
    }
    
  });
})();
