"use strict";

var CompositeView = require("../composite/composite_view");
var $$ = require("lens/substance/application").$$;

// Substance.Image.View
// ==========================================================================

var FootnoteView = function(node, viewFactory) {
  CompositeView.call(this, node, viewFactory);
};

FootnoteView.Prototype = function() {
  this.render = function() {
    CompositeView.prototype.render.call(this);
    if (  this.node.properties.tag == 'author_note') {
      this.content.classList.add("author_note");
	    var header = $$('span.label', {text: this.node.label});
      $(this.content.children).wrapAll('<span class="note"></span>');
	    this.content.insertBefore(header, this.content.firstChild);
    }
    return this;
  };

};

FootnoteView.Prototype.prototype = CompositeView.prototype;
FootnoteView.prototype = new FootnoteView.Prototype();

module.exports = FootnoteView;
