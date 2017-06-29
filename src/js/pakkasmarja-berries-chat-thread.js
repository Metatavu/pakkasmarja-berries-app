/* jshint esversion: 6 */
/* global Camera, device */

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
      this.loadingClassByPlatform = device.platform.toLowerCase() === 'ios' ? 'loading-ios' : 'loading';
      this.sendingClassByPlatform = device.platform.toLowerCase() === 'ios' ? 'sending-ios' : 'sending';
      this.reset();
      this.element.on('click', '.chat-close-btn', $.proxy(this._onChatCloseElementClick, this));
      this.element.on('keydown', '.message-input', $.proxy(this._onMessageInputClick, this));
      this.element.on('click', '.upload-image', $.proxy(this._onUploadImageClick, this));      
      $(document.body).on('message:messages-added', $.proxy(this._onMessagesAdded, this));
      $(`.chat-conversation-wrapper`).scroll($.proxy(this._onWrapperScroll, this));
    },
    
    reset: function () {
      this.activeThreadId = null;
      this.morePages = true;
      this.loading = false;
      this.sending = false;
      this.initialLoad = true;
      this.page = 0;
    },
    
    joinThread: function (threadId) {
      this.reset();
      
      $(`.chat-container .speech-wrapper`).empty();
      this.activeThreadId = threadId;
      this.loadMessages(this.page);
      
      $(".swiper-slide, .secondary-menu").hide("slide", { direction: "left" }, 300);      
      $(".chat-container").show("slide", { direction: "right" }, 300);

      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'mark-item-read',
        'id': threadId
      });
      
      $(".chat-container").addClass("chat-conversation-open");
    },
      
    leaveThread: function() {
      this.activeThreadId = null;
      $(".chat-container").hide("slide", { direction: "right" }, 300);
      $(".chat-container").removeClass("chat-conversation-open");
      $(document.body).pakkasmarjaBerries('restoreMainView');
    },
      
    loadMessages: function (page) {
      if (!this.morePages) {
        return;  
      }
      
      this.loading = true;
      $(`.chat-container .speech-wrapper`).addClass(this.loadingClassByPlatform);
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
      
      return $(document.body).pakkasmarjaBerries('activePage') === 'conversations';
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
      
      const scrollTop = $(`.chat-conversation-wrapper`).scrollTop();
      const marginTop = 120;
      
      $('.chat-container .speech-wrapper').removeClass(`${this.loadingClassByPlatform } ${this.sendingClassByPlatform }`);
      
      const heightOld = $('.chat-container .speech-wrapper').height();
      
      messages.forEach((message) => {
        if (this.activeThreadId === message.threadId) {
          $(`.chat-message[data-id=${message.id}]`).remove();
          $('.chat-container .speech-wrapper').append(pugChatMessage(message));
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
        this.initialLoad = false;
        this.loading = false;
        this.sending = false;
      });
    },
    
    _getLastMessageId: function () {
      return $(`.chat-container .speech-wrapper .chat-message`).last().attr('data-id');
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
      
       navigator.camera.getPicture($.proxy(this._onCapturePhoto, this), $.proxy(this._onCapturePhotoFail, this), {
         quality: 90,
         destinationType: Camera.DestinationType.FILE_URI,
         encodingType: Camera.EncodingType.JPEG,
         mediaType: Camera.MediaType.PICTURE,
         targetHeight: this.options.imageTargetHeight,
         targetWidth: this.options.imageTargetWidth
       });
    },
    
    _onCapturePhoto: function (fileURI) {
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
          this.sending = true;
          $(`.chat-container .speech-wrapper`).addClass(this.sendingClassByPlatform );
          input.val('').blur();
          
          $(`.chat-conversation-wrapper`).animate({
            scrollTop: $('.chat-container .speech-wrapper').height()
          }, 200);
          
          $(document.body).pakkasmarjaBerriesClient('sendMessage', {
            'type': 'send-message',
            'threadId': this.activeThreadId,
            'contents': content
          });
          
          $(document.body).pakkasmarjaBerriesClient('sendMessage', {
            'type': 'mark-item-read',
            'id': this.activeThreadId
          });
        }
      }
    },
    
    _onMessagesAdded: function (event, data) {
      this._addMessages(data['thread-id'], data['messages']);
    }
    
  });
})();
