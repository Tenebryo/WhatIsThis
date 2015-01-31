
/*
 * GET all of the posts for a user
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');

exports.seek = function(req, res){
  res.send("respond with the posts for a user");
};

function get_user_posts(user_id, cb) {//cb : function(err, val);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(user_ss.pack(['posts']));
    it.toArray(function(err, val) {
      if(err) return inCB(err);
      inCB(null, val.map(function(t) {return user_ss.subspace(['posts']).unpack(t.key)[0];}));
    });
  }, cb);
}