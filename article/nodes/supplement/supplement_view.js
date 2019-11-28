"use strict";

var _ = require('underscore');
var NodeView = require("../../nodes/node").View;
var $$ = require("../../../substance/application").$$;
var ResourceView = require('../../resource_view');

// Lens.Supplement.View
// ==========================================================================

var SupplementView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  ResourceView.call(this, options);

};

SupplementView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.renderBody = function() {
    var file;

    if( this.node.url ) {
          file = $$('div.file', {
          children: [
            $$('span', {html: this.node.getHeader() }),
            $$('a', {
              href: this.node.url,
              html: (this.node.icon?'<img src="' + this.node.icon + '"/>':'<i class="fa fa-download"/>') + ' Download',
              target: '_blank',
            })
          ]
        });
    } else {
        file = $$('div.file', {
        children: [
          $$('span', {html: this.node.getHeader() }),
        ]
      });
    }

    this.content.appendChild(file);
  };
};

SupplementView.Prototype.prototype = NodeView.prototype;
SupplementView.prototype = new SupplementView.Prototype();
SupplementView.prototype.constructor = SupplementView;

module.exports = SupplementView;
