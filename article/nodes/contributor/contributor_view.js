"use strict";

var _ = require("underscore");
var NodeView = require("../node").View;
var $$ = require("../../../substance/application").$$;
var ResourceView = require('../../resource_view');
var articleUtil = require("../../article_util");

// Lens.Contributor.View
// ==========================================================================

var ContributorView = function(node, viewFactory, options) {
  NodeView.call(this, node, viewFactory);

  // Mix-in
  options.focus = false;

  ResourceView.call(this, options);
};

ContributorView.Prototype = function() {

  // Mix-in
  _.extend(this, ResourceView.prototype);

  // Render it
  // --------
  //

  this.renderBody = function() {

    // Contributor Name
    // -------

    var name = this.node.name + (this.node.degrees?', '+ this.node.degrees:'');

    var contribName = $$('.contributor-name', {text: name });

    this.content.appendChild(contribName);

    // Contributor Role
    // -------

    if (this.node.role) {
      this.content.appendChild($$('.role', {text: this.node.role}));
    }


    // Add Affiliations
    // -------

    this.content.appendChild($$('.affiliations', {
      children: _.map(this.node.getAffiliations(), function(aff) {

        if( aff.department ) {
          var affText = _.compact([
            aff.department,
            aff.institution,
            aff.city,
            aff.country
          ]).join(', ');

          return $$('.affiliation', {text: affText});
        } else {
          if ( aff.label.length > 0 ) {
            contribName.appendChild($$('span.label .annotation .cross_reference',
              {'data-id': aff.reference_id, text: aff.label}
            ));
          }
          return $$('span', {text: ''});
        }
      })
    }));

    if(this.node.label) {
      this.content.appendChild($$('span.label', {text: this.node.label}));
    }

    // Present Address
    // -------

    if (this.node.present_address) {
      this.content.appendChild(
        $$('.present-address.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Present address: '}),
            $$('span', {text: this.node.present_address})
          ]
        })
      );
    }

    // Contribution
    // -------

    if (this.node.contribution) {
      this.content.appendChild(
        $$('.contribution.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Contribution: '}),
            $$('span', {text: this.node.contribution})
          ]
        })
      );
    }

    // Equal contribution
    // -------


    if (this.node.equal_contrib && this.node.equal_contrib.length > 0) {
      this.content.appendChild(
        $$('.equal-contribution.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Contributed equally with: '}),
            $$('span', {text: this.node.equal_contrib})
          ]
        })
      );
    }


    // Emails
    // -------

    if (this.node.emails.length > 0) {
      this.content.appendChild(
        $$('.emails.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'For correspondence: '}),
            $$('span', {
              children: _.map(this.node.emails, function(email) {
                return $$('a', {href: "mailto:"+email, text: email+' '});
              })
            })
          ]
        })
      );
    }

    // Funding
    // -------

    if (this.node.fundings.length > 0) {
      this.content.appendChild(
        $$('.fundings.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Funding: '}),
            $$('span', {
              text: this.node.fundings.join('; ')
            })
          ]
        })
      );
    }

    // Competing interests
    // -------


    if (this.node.competing_interests.length) {
      this.content.appendChild(
        $$('.competing-interests.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Competing Interests: '}),
            $$('span', {
              text: this.node.competing_interests.join(', ')
            })
          ]
        })
      );
    }


    // ORCID if available
    // -------

    if (this.node.orcid) {
      this.content.appendChild(
        $$('.contrib-data', {
          children: [
            $$('img.orcid', {}),
            $$('a.orcid', { href: this.node.orcid, text: this.node.orcid, target: '_blank' })
          ]
        })
      );
    }



    // Group member (in case contributor is a person group)
    // -------

    if (this.node.members.length > 0) {
      this.content.appendChild(
        $$('.group-members.contrib-data', {
          children: [
            $$('span.contrib-label', {text: 'Group Members: '}),
            $$('span', {
              text: this.node.members.join(', ')
            })
          ]
        })
      );
    }

    // Contributor Bio
    // -------

    if (this.node.image || (this.node.bio && this.node.bio.length > 0) ) {
      var bio = $$('.bio');
      var childs = [$$('img', {src: this.node.image}), bio];

      _.each(this.node.bio, function(par) {
        bio.appendChild(this.createView(par).render().el);
      }, this);

      this.content.appendChild($$('.contributor-bio.container', {
        children: childs
      }));
    }

    // Deceased?
    // -------

    if (this.node.deceased) {
      this.content.appendChild($$('.label', {text: "* Deceased"}));
    }

   // footnote label
    // -------

    if (this.node.footnotes.length > 0) {
      this.content.appendChild($$('.footnotes', {
        children: _.map(this.node.getFootnotes(), function(fn) {
          if (fn.label.length > 0 ) {
            contribName.appendChild($$('span.label .annotation .cross_reference',
              {'data-id': fn.properties.reference_id, text: fn.label}
            ));
          }
          return $$('span', {text: ''});
        })
      }))
    }
  }
}

ContributorView.Prototype.prototype = NodeView.prototype;
ContributorView.prototype = new ContributorView.Prototype();

module.exports = ContributorView;
