"use strict";

var Panel = require('./panel');
var ContainerPanelController = require('./container_panel_controller');

var ContainerPanel = function( doc, config ) {
  Panel.call(this, doc, config);
};
ContainerPanel.Prototype = function() {
  this.createController = function(doc) {
    return new ContainerPanelController(doc, this.config);
  };
};
ContainerPanel.Prototype.prototype = Panel.prototype;
ContainerPanel.prototype = new ContainerPanel.Prototype();

module.exports = ContainerPanel;
