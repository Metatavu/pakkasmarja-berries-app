/* jshint esversion: 6 */
/* global moment */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesNews", {
    options: {
      pageSize: 10
    },
    
    _create: function() {
      this.page = 0;
      this.morePages = true;
      this.loading = false;
      this.element.on('click', '.news-open-btn', $.proxy(this._onNewsElementClick, this));
      this.element.on('click', '.news-close-btn', $.proxy(this._onNewsCloseElementClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:news-items-added', $.proxy(this._onNewsItemsAdded, this));
      $(document.body).on('message:news-unread', $.proxy(this._onNewsUnread, this));
      $(document).on('scrollBottom', $.proxy(this._onScrollBottom, this));
    },
    
    openNews: function(id, title, contents, created, modified, image) {
      let articleImage;
      
      if (image && image.length) {
        articleImage = image;
      } else {
        articleImage = 'gfx/image_placeholder.png';
      }
      
      $(".swiper-slide, .secondary-menu, .navbar-top").hide("slide", { direction: "left" }, 300);
      $(".news-wrapper").html(pugNewsItemOpen({
        createdFormatted: this._formatDate(created),
        modifiedFormatted: this._formatDate(modified),
        title: title,
        contents: contents,
        image: articleImage
      })).show("slide", { direction: "right" }, 300);
      
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'mark-item-read',
        'id': `news-article-${id}`
      });
      
      $(".news-wrapper").addClass("news-article-open");
    },
    
    closeNews: function() {
      $(".news-wrapper").hide("slide", { direction: "right" }, 300);
      $(document.body).pakkasmarjaBerries('restoreMainView');      
    },
    
    loadPage: function () {
      if (!this.morePages) {
        return;  
      }
      
      $('.news-view').addClass('loading');
      this.loading = true;
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-news',
        'page': this.page,
        'perPage': this.options.pageSize
      });
    },
    
    isActive: function () {
      return $(document.body).pakkasmarjaBerries('activePage') === 'news';
    },
    
    _addNewsItem: function (newsItems) {
      this.loading = false;
      $(`.news-view`).removeClass('loading');
      newsItems.forEach((newsItem) => {
        $(`.news-item[data-id=${newsItem.id}]`).remove();
        $('.news-view ul').append(pugNewsItem(Object.assign(newsItem, {
          createdFormatted: this._formatDate(newsItem.created),
          modifiedFormatted: this._formatDate(newsItem.modified)
        })));
      });
      
      if (newsItems.length < this.options.pageSize) {
        this.morePages = false;
      }

      this._sortNewsItems();
    },
    
    _sortNewsItems: function () {
      $('.news-item').sort((newsItem1, newsItem2) => {
        const modified1 = moment($(newsItem1).attr('data-modified'));
        const modified2 = moment($(newsItem2).attr('data-modified'));
        return modified2.diff(modified1);
      }).appendTo('.news-view ul');
    },
    
    _formatDate: function (date) {
      return moment(date).locale('fi').format('DD.MM.YYYY HH:mm');
    },
    
    _onScrollBottom: function () {
      if (this.loading || !this.isActive()) {
        return;
      }
      
      this.page++;
      this.loadPage();
    },
    
    _onConnect: function (event, data) {
      this.loadPage();
    },
    
    _onNewsItemsAdded: function (event, data) {
      this._addNewsItem(data.items);
      
      if ($(document.body).pakkasmarjaBerries('activePage') !== 'news') {
        $('.menu-item[data-page="news"]').addClass('unread');  
      }
    },
    
    _onNewsUnread: function (event, data) {
      $('.menu-item[data-page="news"]').addClass('unread');
    },
    
    _onNewsElementClick: function(event) {
      event.preventDefault();
      
      const item = $(event.target).closest('.news-item');
      const id = item.attr('data-id');
      const title = item.attr('data-title');
      const contents = item.attr('data-contents');
      const created = item.attr('data-created');
      const modified = item.attr('data-modified');
      const image = item.attr('data-image');
      item.removeClass('unread').addClass('read');      
      this.openNews(id, title, contents, created, modified, image);
    },
    
    _onNewsCloseElementClick: function(event) {
      event.preventDefault();
      this.closeNews();
    }
    
  });
})();
