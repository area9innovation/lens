"use strict";

var _ = require("underscore");
var View = require("../substance/application").View;
var Data = require("../substance/data");
var Index = Data.Graph.Index;
var $$ = require("../substance/application").$$;

// Lens.Reader.View
// ==========================================================================
//

var ReaderView = function(readerCtrl) {
  View.call(this);

  // Controllers
  // --------

  this.readerCtrl = readerCtrl;
  this.doc = this.readerCtrl.getDocument();
  this.isResourcesPanel = readerCtrl.isResourcesPanel;

  this.$el.addClass('article');
  this.$el.addClass(this.doc.schema.id); // Substance article or lens article?

  // Stores latest body scroll positions per panel

  this.bodyScroll = {};

  // Panels
  // ------
  // Note: ATM, it is not possible to override the content panel + toc via panelSpecification
  this.contentView = readerCtrl.panelCtrls.content.createView();
  this.tocView = this.contentView.getTocView();
  this.panelViews = {};
  // mapping to associate reference types to panels
  // NB, in Lens each resource type has one dedicated panel;
  // clicking on a reference opens this panel
  this.panelForRef = {};

  _.each(readerCtrl.panels, function(panel) {
    var name = panel.getName();
    var panelCtrl = readerCtrl.panelCtrls[name];
    this.panelViews[name] = panelCtrl.createView();
    _.each(panel.config.references, function(refType) {
      this.panelForRef[refType] = name;
    }, this);
  }, this);
  this.panelViews['toc'] = this.tocView;

  // Keep an index for resources
  this.resources = new Index(this.readerCtrl.getDocument(), {
    types: ["resource_reference"],
    property: "target"
  });

  // whenever a workflow takes control set this variable
  // to be able to call it a last time when switching to another
  // workflow
  this.lastWorkflow = null;
  this.lastPanel = readerCtrl.currentPanel;

  // Events
  // --------
  //

  this._onTogglePanel = _.bind( this.switchPanel, this );

  // Whenever a state change happens (e.g. user navigates somewhere)
  // the interface gets updated accordingly
  this.listenTo(this.readerCtrl, "state-changed", this.updateState);

  this.listenTo(this.tocView,'toggle', this._onTogglePanel);
  _.each(this.panelViews, function(panelView) {
    this.listenTo(panelView, "toggle", this._onTogglePanel);
    this.listenTo(panelView, "toggle-resource", this.onToggleResource);
    this.listenTo(panelView, "toggle-resource-reference", this.onToggleResourceReference);
    this.listenTo(panelView, "toggle-fullscreen", this.onToggleFullscreen);
  }, this);

  // TODO: treat content panel as panelView and delegate to tocView where necessary
  this.listenTo(this.contentView, "toggle", this._onTogglePanel);
  this.listenTo(this.contentView, "toggle-resource", this.onToggleResource);
  this.listenTo(this.contentView, "toggle-resource-reference", this.onToggleResourceReference);
  this.listenTo(this.contentView, "toggle-fullscreen", this.onToggleFullscreen);

  // attach workflows
  _.each(this.readerCtrl.workflows, function(workflow) {
    workflow.attach(this.readerCtrl, this);
  }, this);


  // attach a lazy/debounced handler for resize events
  // that updates the outline of the currently active panels
  $(window).resize(_.debounce(_.bind(function() {
    this.contentView.scrollbar.update();
    var currentPanel = this.panelViews[this.readerCtrl.state.panel];
    if (currentPanel && currentPanel.hasScrollbar()) {
      currentPanel.scrollbar.update();
    }
  }, this), 1));

};

ReaderView.Prototype = function() {


  // Rendering
  // --------
  //

  this.render = function() {
    var frag = document.createDocumentFragment();

    // Prepare doc view
    // --------

    var contentViewHtml = this.contentView.render().el;

    if (this.isResourcesPanel) {
      // Prepare panel toggles
      // --------

      var panelToggles = $$('.context-toggles');
      panelToggles.appendChild(this.tocView.getToggleControl());
      this.tocView.on('toggle', this._onClickPanel);
      _.each(this.readerCtrl.panels, function(panel) {
        var panelView = this.panelViews[panel.getName()];
        var toggleEl = panelView.getToggleControl();
        panelToggles.appendChild(toggleEl);
        panelView.on('toggle', this._onClickPanel);
      }, this);


      // Prepare panel views
      // -------

      // Wrap everything within resources view
      var resourcesViewEl = $$('.resources');
      resourcesViewEl.appendChild(this.tocView.render().el);
      _.each(this.readerCtrl.panels, function(panel) {
        var panelView = this.panelViews[panel.getName()];
     // console.log('Rendering panel "%s"', panel.getName());
        resourcesViewEl.appendChild(panelView.render().el);
      }, this);

      var menuBar = $$('.menu-bar');

      menuBar.appendChild(panelToggles);
      resourcesViewEl.appendChild(menuBar);
      frag.appendChild(resourcesViewEl);
    } else {
      $(contentViewHtml).addClass('width100');
    }

    frag.appendChild(contentViewHtml);

    // Scrollbar cover
    // This is only there to cover the content panel's scrollbar in Firefox.
    var scrollbarCover = $$('.scrollbar-cover');
    this.contentView.el.appendChild(scrollbarCover);

    this.el.appendChild(frag);


    // TODO: also update the outline after image (et al.) are loaded

    // Postpone things that expect this view has been inserted into the DOM already.
    _.delay(_.bind( function() {
      // initial state update here as scrollTo would not work out of DOM
      this.updateState();

      var self = this;
      // MathJax requires the processed elements to be in the DOM
      if (window.MathJax){
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        window.MathJax.Hub.Queue(function () {
          // HACK: using updateState() instead of updateScrollbars() as it also knows how to scroll
          self.updateState();
        });
      }
    }, this), 1);

    return this;
  };

  // Free the memory.
  // --------
  //

  this.dispose = function() {
    _.each(this.workflows, function(workflow) {
      workflow.detach();
    });

    this.contentView.dispose();
    _.each(this.panelViews, function(panelView) {
      panelView.off('toggle', this._onClickPanel);
      panelView.dispose();
    }, this);
    this.resources.dispose();
    this.stopListening();
  };

  this.getState = function() {
    return this.readerCtrl.state;
  };

  // Explicit panel switch
  // --------
  //
  // Only triggered by the explicit switch
  // Implicit panel switches happen when someone clicks a figure reference

  this.switchPanel = function(panel) {
    this.readerCtrl.switchPanel(panel);
    // keep this so that it gets opened when leaving another panel (toggling reference)
    this.lastPanel = panel;
  };

  // Update Reader State
  // --------
  //
  // Called every time the controller state has been modified
  // Search for readerCtrl.modifyState occurences

  this.updateState = function() {
    var self = this;
    var state = this.readerCtrl.state;

    var handled;

    // EXPERIMENTAL: introducing workflows to handle state updates
    // we extract some info to make it easier for workflows to detect if they
    // need to handle the state update.
    var stateInfo = {
      focussedNode: state.focussedNode ? this.doc.get(state.focussedNode) : null
    };

    var currentPanelView = (state.panel === "content" || !this.isResourcesPanel) ? this.contentView : this.panelViews[state.panel];

    _.each(this.panelViews, function(panelView) {
      if (!panelView.isHidden()) panelView.hide();
    });

    // Always deactivate previous highlights
    this.contentView.removeHighlights();

    // and also remove highlights from resource panels
    _.each(this.panelViews, function(panelView) {
      panelView.removeHighlights();
    });

    // Highlight the focussed node
    if (state.focussedNode) {
      var classes = ['focussed', 'highlighted'];
      // HACK: abusing addHighlight for adding the fullscreen class
      // instead I would prefer to handle such focussing explicitely in a workflow
      if (state.fullscreen) {
        classes.push('fullscreen');
        $('.surface.resource-view.figures').css('-webkit-overflow-scrolling', 'auto');
      } else {
        $('.surface.resource-view.figures').css('-webkit-overflow-scrolling', 'touch');
      }
      this.contentView.addHighlight(state.focussedNode, classes.concat('main-occurrence').join(' '));
      classes.push('highlighted_iterator');
      currentPanelView.addHighlight(state.focussedNode, classes.join(' '));
      currentPanelView.scrollTo(state.focussedNode);
    }

    // A workflow needs to take care of
    // 1. showing the correct panel
    // 2. setting highlights in the content panel
    // 3. setting highlights in the resource panel
    // 4. scroll panels
    // A workflow should have Workflow.handlesStateUpdates = true if it is interested in state updates
    // and should override Workflow.handleStateUpdate(state, info) to perform the update.
    // In case it has been responsible for the update it should return 'true'.

    // TODO: what is this exactly for?
    if (this.lastWorkflow) {
      handled = this.lastWorkflow.handleStateUpdate(state, stateInfo);
    }

    if (!handled) {
      // Go through all workflows and let them try to handle the state update.
      // Stop after the first hit.
      for (var i = 0; i < this.readerCtrl.workflows.length; i++) {
        var workflow = this.readerCtrl.workflows[i];
        // lastWorkflow had its chance already, so skip it here
        if (workflow !== this.lastWorkflow && workflow.handlesStateUpdate) {
          handled = workflow.handleStateUpdate(state, stateInfo);
          if (handled) {
            this.lastWorkflow = workflow;
            break;
          }
        }
      }
    }

    var focussedPanelView;

    // If not handled above, we at least show the correct panel
    if (!handled) {
      // Default implementation for states with a panel set
      if (state.panel !== "content" && this.isResourcesPanel) {
        var panelView = this.panelViews[state.panel];
        this.showPanel(state.panel);
        // if there is a resource focussed in the panel, activate the resource, and highlight all references to it in the content panel
        if (state.focussedNode) {
          // get all references that point to the focussedNode and highlight them
          var refs = this.resources.get(state.focussedNode);
          var refsArray = [];
          _.each(refs, function(ref) {
            this.contentView.addHighlight(ref.id, "highlighted highlighted_iterator");
            refsArray.push(ref);
          }, this);

          var view = this.contentView;
          var hIdx = _.findIndex(refsArray, function(ref){return $(view.findNodeView(ref.id)).hasClass('highlighted_current');});
          if(hIdx != -1) {
            $(view.findNodeView(refsArray[hIdx].id)).removeClass('highlighted_current');
            ++hIdx;
            if(hIdx>=refsArray.length) {
              hIdx = 0;
            }
          } else {
            hIdx = 0;
          }
          view.scrollTo(refsArray[hIdx].id, true);
          $(view.findNodeView(refsArray[hIdx].id)).addClass('highlighted_current');
          if(hIdx==refsArray.length-1) $(panelView.findNodeView(state.focussedNode)).addClass('highlighted_last');

          // TODO: Jumps to wrong position esp. for figures, because content like images has not completed loading
          // at that stage. WE should make corrections afterwards
          if (panelView.hasScrollbar()) {
            focussedPanelView = panelView;
            panelView.scrollTo(state.focussedNode);
          }
        }
      } else {
        this.showPanel("toc");
      }
    }

    // HACK: Update the scrollbar after short delay
    // This was necessary after we went back to using display: none for hiding panels,
    // instead of visibility: hidden (caused problems with scrolling on iPad)
    // This hack should not be necessary if we can ensure that
    // - panel is shown first (so scrollbar can grab the dimensions)

    self.updateScrollbars();
    _.delay(function() {
      self.updateScrollbars();
    }, 2000);

    // - whenever the contentHeight changes scrollbars should be updated
    // - e.g. when an image completed loading

    var handcarWorker = function() {
      var imageFillin = this;
      var img = document.createElement('img');
      var deferred = $.Deferred();

      deferred.always(function(){
        $(imageFillin).replaceWith(img);

        self.updateScrollbars();
        if ( focussedPanelView && state.focussedNode ) {
          focussedPanelView.scrollTo(state.focussedNode);
        }
      });

      $(img).one('load', deferred.resolve);

      img.src = this.dataset.src;      
    };

    if ( focussedPanelView && state.focussedNode ) {
      $('.surface.resource-view.figures .image-wrapper a span[data-id='+state.focussedNode+']').each(handcarWorker);
    }

    $('.surface.resource-view.figures .image-wrapper a span').each(handcarWorker);
  };

  this.updateScrollbars = function() {
    var state = this.readerCtrl.state;
    // var currentPanelView = state.panel === "content" ? this.contentView : this.panelViews[state.panel];
    this.contentView.scrollbar.update();

    _.each(this.panelViews, function(panelView) {
      if (panelView.hasScrollbar()) panelView.scrollbar.update();
    });
    // if (currentPanelView && currentPanelView.hasScrollbar()) currentPanelView.scrollbar.update();
  };

  this.showPanel = function(name) {
    if (this.panelViews[name]) {
      this.panelViews[name].activate();
      this.el.dataset.context = name;
    } else if (name === "content") {
      this.panelViews.toc.activate();
      this.el.dataset.context = name;
    }
  };

  this.getPanelView = function(name) {
    return this.panelViews[name];
  };

  // Toggle (off) a resource
  // --------
  //

  this.onToggleResource = function(panel, id, element) {
    if ( element.classList.contains('highlighted_iterator') && element.classList.contains('highlighted_last')
        ||
        !element.classList.contains('highlighted_iterator') && element.classList.contains('highlighted') ) {
      $(element).removeClass('highlighted_last');
      this.readerCtrl.modifyState({
        panel: panel,
        focussedNode: null,
        fullscreen: false
      });
    } else {
      this.readerCtrl.modifyState({
        panel: panel,
        focussedNode: id
      });
    }
  };

  // Toggle (off) a reference
  // --------

  this.onToggleResourceReference = function(panel, id, element) {
    if (element.classList.contains('highlighted')) {
      this.readerCtrl.modifyState({
        panel: this.lastPanel,
        focussedNode: null,
        fullscreen: false
      });
    } else {
      // FIXME: ATM the state always assumes 'content' as the containing panel
      // Instead, we also let the panel catch the event and then delegate to ReaderView providing the context as done with onToggleResource
      this.readerCtrl.modifyState({
        panel: "content",
        focussedNode: id,
        fullscreen: false
      });
    }
  };

  this.onToggleFullscreen = function(panel, id) {
    var fullscreen = !this.readerCtrl.state.fullscreen;
    this.readerCtrl.modifyState({
      panel: panel,
      focussedNode: id,
      fullscreen: fullscreen
    });
  };

};

ReaderView.Prototype.prototype = View.prototype;
ReaderView.prototype = new ReaderView.Prototype();
ReaderView.prototype.constructor = ReaderView;

module.exports = ReaderView;
