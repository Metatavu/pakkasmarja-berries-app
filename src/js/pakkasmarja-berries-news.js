/* jshint esversion: 6 */
/* global moment */

(function() {
  'use strict';
  
  $.widget("custom.pakkasmarjaBerriesNews", {
    options: {
      pageSize: 15
    },
    
    _create: function() {
      this.page = 1;
      this.morePages = true;
      this.element.on('click', '.news-open-btn', $.proxy(this._onNewsElementClick, this));
      this.element.on('click', '.news-close-btn', $.proxy(this._onNewsCloseElementClick, this));
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:news-items-added', $.proxy(this._onNewsItemsAdded, this));
    },
    
    openNews: function(title, contents, created, modified) {
      $(".swiper-slide, .secondary-menu, .navbar-top").hide("slide", { direction: "left" }, 300);
      $(".news-wrapper").html(pugNewsItemOpen({
        createdFormatted: this._formatDate(created),
        modifiedFormatted: this._formatDate(modified),
        title: title,
        contents: contents
      })).show("slide", { direction: "right" }, 300);
    },
    
    closeNews: function() {
      $(".news-wrapper").hide("slide", { direction: "right" }, 300);
      $(".swiper-slide, .secondary-menu, .navbar-top").show("slide", { direction: "left" }, 300);
    },
    
    _addNewsItem: function (newsItems) {
      newsItems.forEach((newsItem) => {              
        $(`.news-item[data-id=${newsItem.id}]`).remove();
        $('.news-view ul').append(pugNewsItem(Object.assign(newsItem, {
          createdFormatted: this._formatDate(newsItem.created),
          modifiedFormatted: this._formatDate(newsItem.modified)
        })));
      });
      
      if (newsItems.length < this.pageSize) {
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
      return moment(date).locale('fi').format('LLLL');
    },
    
    _onConnect: function (event, data) {
      $(document.body).pakkasmarjaBerriesClient('sendMessage', {
        'type': 'get-news',
        'page': this.page,
        'perPage': this.options.pageSize
      });
    },
    
    _onNewsItemsAdded: function (event, data) {
      this._addNewsItem(data.items);
    },
    
    _onNewsElementClick: function(event) {
      event.preventDefault();
      
      const item = $(event.target).closest('.news-item');
      const title = item.attr('data-title');
      const contents = item.attr('data-contents');
      const created = item.attr('data-created');
      const modified = item.attr('data-modified');
      
      this.openNews(title, contents, created, modified);
    },
    
    _onNewsCloseElementClick: function(event) {
      event.preventDefault();
      this.closeNews();
    }
    
  });
})();
