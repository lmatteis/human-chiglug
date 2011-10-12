 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { _id:'_design/app'
  , rewrites : 
    [ {from:"/", to:'index.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;

ddoc.views = {};

ddoc.views.linksByUser = {
    map: function (doc) {
        if(doc.type == "link")
            emit(doc.user, 1);
    },
    reduce:"_sum"
};
ddoc.views.latestLinks = {
    map: function (doc) {
        if(doc.type == "link" && doc.created_at)
            emit(doc.created_at, doc);
    }
}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
