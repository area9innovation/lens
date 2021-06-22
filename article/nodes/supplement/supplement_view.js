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
      var topics = (new URL(location)).searchParams.get('topics'),
        urlParams = (new URL(this.node.url)).searchParams,
        id = urlParams.get('rsuite_id'),
        type = urlParams.get('type'),
        subtype = urlParams.get('subtype');

      topics = topics ? topics.split(/\+/) : [];

      switch (type) {
        case 'supplement': break;
        case 'pdf':
        case 'zip': type = subtype === 'disclosure' ? subtype : 'article'; break;
        default: type = 'unknown';
      }

      file = $$('div.file', {
        children: [
          $$('span', {html: this.node.getHeader() }),
          $$('a', {
            class: 'jbjs_tracking',
            jbjs_tracking_type: 'download',
            jbjs_tracking_data: JSON.stringify({ id, type, topics }),
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
