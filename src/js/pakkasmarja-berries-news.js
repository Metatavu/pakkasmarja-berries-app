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
      $(document.body).on('connect', $.proxy(this._onConnect, this));
      $(document.body).on('message:news-items-added', $.proxy(this._onNewsItemsAdded, this));
    },
    
    _addNewsItem: function (newsItems) {
      newsItems.forEach((newsItem) => {              
        $(`.news-item[data-id=${newsItem.id}]`).remove();
        $('.news-view ul').append(pugNewsItem(Object.assign(newsItem, {
          createdFormatted: moment(newsItem.created).locale('fi').format('LLLL'),
          modifiedFormatted: moment(newsItem.modified).locale('fi').format('LLLL')
        })));
      });
      
      if (newsItems.length < this.pageSize) {
        this.morePages = false;
      }

      this._sortNewsItems();
    },
    
    _sortNewsItems() {
      $('.news-item').sort((newsItem1, newsItem2) => {
        const modified1 = moment($(newsItem1).attr('data-modified'));
        const modified2 = moment($(newsItem2).attr('data-modified'));
        return modified2.diff(modified1);
      }).appendTo('.news-view ul');
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
    }
    
  });
})();
