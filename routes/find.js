
/*
 * GET x-amount of posts
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');

exports.index = function(req, res){
  get_posts(10, function(e, v) {

    if(e) throw e;

    console.log(v);

    function stupidthing(it, acc, i) {
      try {
        var t = it[i];
        console.log(t);
        get_post_image(t.post, function(e1, v1) {
          if (e1) throw e1;
          t.img = 'thmbnl'+v1;
          acc[i] = t;
          stupidthing(it, acc, i+1);
        });
      } catch (e) {
        res.render('find', {things: acc });
      }
    }

    stupidthing(v, [], 0);

  });
};

function _unpack(t) {
  return fdb.tuple.unpack(t)[0];
}

function _pack(t) {
  return fdb.tuple.pack([t]);
}

function get_posts(count, cb) {//cb : function(err, val);
  var post_index_ss = new fdb.Subspace(['post_index', 'posts']);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(post_index_ss.key(), {reverse:true});
    
    var result = [];

    var c = 0;
    it.forEach(function(kv, cb) {
      result[c] = {post:post_index_ss.unpack(kv.key)[0], user:_unpack(kv.value)};
      if (++c === count)
        cb (null, null);
      else
        cb();
    });

    inCB(null, result);
  }, cb);
}

function get_post_image(post_id, cb) { //cb : function(err, val);
  var post_ss = new fdb.Subspace(['posts', post_id]);
  db.doTransaction(function(tr, inCB){
    tr.get(post_ss.pack(['image']), function(err, val) {
      if(err) return inCB(err);
      inCB(null, _unpack(val));
    });

  }, cb);
};

