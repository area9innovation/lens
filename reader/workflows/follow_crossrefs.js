"use strict";

var _ = require('underscore');
var Workflow = require('./workflow');

var FollowCrossrefs = function() {
  Workflow.apply(this, arguments);

  this._followCrossReference = _.bind(this.followCrossReference, this);
};

FollowCrossrefs.Prototype = function() {

  this.registerHandlers = function() {
    this.readerView.$el.on('click', '.annotation.cross_reference', this._followCrossReference);
  };

  this.unRegisterHandlers = function() {
    this.readerView.$el.off('click', '.annotation.cross_reference', this._followCrossReference);
  };

  this.followCrossReference = function(e) {
    e.preventDefault();
    e.stopPropagation();
    var refId = e.currentTarget.dataset.id;
    var crossRef = this.readerCtrl.getDocument().get(refId);
    
    if( this.readerView.contentView.findNodeView(crossRef.target) ) {
      this.readerView.contentView.scrollTo(crossRef.target);
    } else if( this.readerView.panelViews.info.findNodeView(crossRef.target) ) {
      this.readerView.panelViews.info.scrollTo(crossRef.target);
    }
  };

};
FollowCrossrefs.Prototype.prototype = Workflow.prototype;
FollowCrossrefs.prototype = new FollowCrossrefs.Prototype();

module.exports = FollowCrossrefs;
