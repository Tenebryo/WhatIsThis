
/*
 * GET x-amount of posts
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');


exports.index = function(req, res){
  var fileNames = fs.readdirSync('public/images').slice(0, 10);
  for (var i = 0; i < fileNames.length; i++) {
    fileNames[i] = 'images/' + fileNames[i];
  };
  res.render('find', { files: fileNames});
};


function get_posts(count, cb) {//cb : function(err, val);
  var post_index_ss = new fdb.Subspace(['post_index', 'posts']);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(post_index_ss.key(), {reverse:true});
    
    var result = [];

    var c = 0;
    it.forEach(function(kv, cb) {
      result[c] = {key:post_index_ss.unpack(kv.key)[0], value:_unpack(kv.value)};
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
      return inCB(null, _unpack(val));
    });

  }, cb);
};

