"use strict";

var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
var articleUtil = require("../../article_util");

var _labels = {
  "received": "received",
  "accepted" : "accepted",
  "revised": "revised",
  "corrected": "corrected",
  "rev-recd": "revised",
  "rev-request": "returned for modification",
  "published": "published",
  "default": "updated",
};

// Lens.PublicationInfo.View
// ==========================================================================

var PublicationInfoView = function(node, viewFactory) {
  NodeView.call(this, node, viewFactory);

};

PublicationInfoView.Prototype = function() {

  this.render = function() {
    NodeView.prototype.render.call(this);

    // Display article meta information
    // ----------------

    var metaData = $$('.meta-data');


    // Article Type
    //

    if (this.node.article_type) {
      var articleTypeEl = $$('.article-type.container', {
        children: [
          $$('div.label', {text: "Article Type"}),
          $$('div.value', {
            text: this.node.article_type
          })
        ]
      });
      metaData.appendChild(articleTypeEl);
    }

    // Subject
    //

    if (this.node.subjects && this.node.subjects.length > 0) {
      var subjectEl = $$('.subject.container', {
        children: [
          $$('div.label', {text: "Subject"}),
          $$('div.value', {
            text: this.node.subjects.join(', ')
          })
        ]
      });
      metaData.appendChild(subjectEl);
    }

    // Organisms
    //

    if (this.node.research_organisms && this.node.research_organisms.length > 0) {
      var organismsEl = $$('.subject.container', {
        children: [
          $$('div.label', {text: "Organism"}),
          $$('div.value', {
            text: this.node.research_organisms.join(', ')
          })
        ]
      });
      metaData.appendChild(organismsEl);
    }

    // Keywords
    //

    if (this.node.keywords && this.node.keywords.length > 0) {
      var keywordsEl = $$('.keywords.container', {
        children: [
          $$('div.label', {text: "Keywords"}),
          $$('div.value', {
            text: this.node.keywords.join(', ')
          })
        ]
      });
      metaData.appendChild(keywordsEl);
    }

    // Journal title
    //

    if (this.node.journal) {
      var journalEl = $$('.journal', {
        children: [
          $$('div.label', {text: "Journal"}),
          $$('div.value', {
            children: [$$('span', { text: this.node.journal })]
          })
        ]
      });
      metaData.appendChild(journalEl);
    }

    // Publishing info
    //

    if (this.node.published_on) {
      var dayUnknown = false;
      
      var parts = this.node.published_on.split('-');
      if ( parts.length < 3) {
        parts.push(1);
        dayUnknown = true;
      }

      var localDate = new Date(parts[0], parts[1]-1, parts[2]);
      var pubDate = localDate.toDateString().slice(4, 16).replace(/\b0+/g, '').split(' ');
      var pubInfo = [ this.node.published_info.volume, '(' +this.node.published_info.issue + '):', this.node.published_info.fpage].join(' ');

      var reorderedDate = [];
      reorderedDate.push(pubDate[2]);
      reorderedDate.push(pubDate[0]);
      if ( !dayUnknown ) {
        reorderedDate.push(pubDate[1]);
      }
      
      var journalEl = $$('.publishing', {
        children: [
          $$('div.label', {text: "Published"}),
          $$('div.value', {
            children: [$$('span', { text: reorderedDate.join(' ') + '; ' + pubInfo })]
          })
        ]
      });
      metaData.appendChild(journalEl);
    }

    // Related Article
    //

    if (this.node.related_article) {
      var relatedArticleEl = $$('.related-article.container', {
        children: [
          $$('div.label', {text: "Related Article"}),
          $$('div.value', {
            children: [$$('a', {href: this.node.related_article, text: this.node.related_article})]
          })
        ]
      });
      metaData.appendChild(relatedArticleEl);
    }

    var historyEl = this.describePublicationHistory();

    metaData.appendChild(historyEl);

    this.content.appendChild(metaData);

    // Display article information
    // ----------------

    var articleInfo = this.node.getArticleInfo();

    var articleInfoView = this.viewFactory.createView(articleInfo);
    var articleInfoViewEl = articleInfoView.render().el;
    this.content.appendChild(articleInfoViewEl);

    return this;
  };

  // Creates an element with a narrative description of the publication history

  this.describePublicationHistory = function() {
    var datesEl = $$('.dates');
    var i;

    var dateEntries = [];
    if (this.node.history && this.node.history.length > 0) {
      dateEntries = dateEntries.concat(this.node.history);
    }
    if (this.node.published_on) {
      dateEntries.push({
        type: 'published',
        date: this.node.published_on
      });
    }

    // If there is any pub history, create a narrative following
    // 'The article was ((<action> on <date>, )+ and) <action> on <date>'
    // E.g.,
    // 'This article was published on 11. Oct. 2014'
    // 'This article was accepted on 06.05.2014, and published on 11. Oct. 2014'

    if (dateEntries.length > 0) {
      datesEl.appendChild(document.createTextNode("The article was "));
      for (i = 0; i < dateEntries.length; i++) {
        // conjunction with ', ' or ', and'
        if (i > 0) {
          datesEl.appendChild(document.createTextNode(', '));
          if (i === dateEntries.length-1) {
            datesEl.appendChild(document.createTextNode('and '));
          }
        }
        var entry = dateEntries[i];
        datesEl.appendChild(document.createTextNode((_labels[entry.type] || _labels.default)+ ' on '));
        datesEl.appendChild($$('b', {
          text: articleUtil.formatDate(entry.date)
        }));
      }
      datesEl.appendChild(document.createTextNode('.'));
    }

    return datesEl;
  };

  this.dispose = function() {
    NodeView.prototype.dispose.call(this);
  };
};

PublicationInfoView.Prototype.prototype = NodeView.prototype;
PublicationInfoView.prototype = new PublicationInfoView.Prototype();

module.exports = PublicationInfoView;
