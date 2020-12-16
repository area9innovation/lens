"use strict";

var _ = require('underscore');
var CompositeView = require("../composite").View;
var $$ = require ("../../../substance/application").$$;
var ResourceView = require('../../resource_view');
var NodeView = require("../node").View;

// Substance.Figure.View
// ==========================================================================

var FigureView = function(node, viewFactory, options) {
  CompositeView.call(this, node, viewFactory);


  // Mix-in
  ResourceView.call(this, options);
};

FigureView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  this.isZoomable = true;

  // Rendering
  // =============================
  //

  this.render = function() {
    this.options.focus = this.node.referenced;

    NodeView.prototype.render.call(this);

    if ( this.node.referenced ) {
      this.renderHeader();
    }

    this.renderBody();
    return this;
  };

  this.renderBody = function() {
    dev.trace("render figure original");

    if ( !this.node.referenced ) {
      this.content.appendChild($$('.label', {text: this.node.label}));
    }

    if (this.node.urls.length) {
      this.node.urls.forEach(function(url) {
        // Add graphic (img element)
        var imgEl = $$('.image-wrapper', {
          children: [
            $$("a", {
              href: url,
              target: "_blank",
              children: [$$("span", {"data-src": url, "data-id": this.node.id})]
            })
          ]
        });
        this.content.appendChild(imgEl);
      }, this);
    }
    this.renderChildren();
    // Attrib
    if (this.node.attrib) {
      this.content.appendChild($$('.figure-attribution', {text: this.node.attrib}));
    }
  };

  this.renderLabel = function() {
    var labelEl = $$('.name', {
      href: "#"
    });

    this.renderAnnotatedText([this.node.id, 'label'], labelEl);
    return labelEl;
  };

};

FigureView.Prototype.prototype = CompositeView.prototype;
FigureView.prototype = new FigureView.Prototype();

module.exports = FigureView;
