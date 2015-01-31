
/*
 * GET x-amount of posts
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');

// called on GET
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
          get_endorsements(t.post, function(e2, v2) {
            if (e2) throw e2;
            t.endorse = v2;
            acc[i] = t;
            stupidthing(it, acc, i+1);
          });
        });
      } catch (e) {
        res.render('find', {things: acc });
      }
    }

    stupidthing(v, [], 0);

  });
};

// called on POST
exports.submit = function(req, res){

  var answer = req.body.answer;
  var post_id = req.body.postid;

  add_endorsement_to_suggestion(post_id,req.body.answer,1,0);

  res.redirect('/');
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

function get_endorsements(post_id, cb) {
  var post_ss = new fdb.Subspace(['posts', post_id]);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(post_ss.pack(['e']), {streamingMode: fdb.streamingMode.want_all});
    it.toArray(function(err, arr) {
      if (err) return inCB(err);
      inCB(null, arr);
    });
  }, cb);
}

//add a user's indentification of an object according to their credibility
function add_endorsement_to_suggestion(post_id, iden, credits, user_id) {
  var post_ss = new fdb.Subspace(['posts', post_id]);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB){

    tr.get(post_ss.pack(['e', iden]), function(err, v) {

      if(err) return inCB(err);

      tr.get(post_ss.pack(['top']), function(err1, v1) {

        if(err1) return inCB(err);
        var val1 = -1;
        if (v1) val1 = _unpack(v1);

        if(!v) {
          if(!val1 || (val1 < credits)) {
            tr.set(post_ss.pack(['top', 'val']), _pack(credits));
            tr.set(post_ss.pack(['top', 'iden']), _pack(iden));
          }
          tr.set(post_ss.pack(['e', iden]), _pack(credits));
        } else {
          var val = _unpack(v);
          if(!val1 || (val1 < val + credits)) {
            tr.set(post_ss.pack(['top', 'val']), _pack(val + credits));
            tr.set(post_ss.pack(['top', 'iden']), _pack(iden));
          }
          tr.set(post_ss.pack(['e', iden]), _pack(val + credits));
        }

        tr.set(user_ss.pack(['indentifications', post_id]), _pack(iden));

        inCB(null, true);

      });
    });


  });
};

function get_post_image(post_id, cb) { //cb : function(err, val);
  var post_ss = new fdb.Subspace(['posts', post_id]);
  db.doTransaction(function(tr, inCB){
    tr.get(post_ss.pack(['image']), function(err, val) {
      if(err) return inCB(err);
      inCB(null, _unpack(val));
    });

  }, cb);
};

