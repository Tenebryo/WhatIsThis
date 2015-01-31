
/*
 * GET users listing.
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');

exports.index = function(req, res){
	res.render("post");
  //res.send("post something");
};

exports.form = function(req, res) {

  res.send('You sent ' + req.body.test_file)

  get_user_identifications(3301, function(e, v) {
    if (!e) console.log(v);
  });

/*
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
      console.log("Uploading: " + filename); 
      fstream = fs.createWriteStream(__dirname + '/files/' + filename);
      file.pipe(fstream);
      fstream.on('close', function () {
          res.redirect('back');
      });
  });//*/

};

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
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
      result[c] = {key:post_index_ss.unpack(kv.key)[0], value:_unpack(kv.value)};
      if (++c === count)
        cb (null, null);
      else
        cb();
    });

    inCB(null, result);
  }, cb);
}

function new_post(user_id, cb) {//cb : function(err, val);
  var post_index_ss = new fdb.Subspace(['post_index']);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {

    tr.get(post_index_ss.pack(['next_id']), function(err, val) {
      if (err) return inCB(err);
      var v = 0;
      if (!val) tr.set(post_index_ss.pack(['next_id']), _pack(0));
      else      v = _unpack(val);
      console.log(v);
      tr.set(post_index_ss.pack(['next_id']), _pack(v+1));
      tr.set(post_index_ss.pack(['posts', v]), _pack(user_id));
      tr.set(user_ss.pack(['posts', v]), _pack(true));
      return inCB(null, val);
    });

  }, cb);
}

function set_post_image(post_id, filename)
{
  var post_ss = new fdb.Subspace(['posts', post_id]);
  db.doTransaction(function(tr, inCB){

    tr.set(post_ss.pack(['image']), _pack(filename));

    inCB(null, true);

  })
};

function get_post_image(post_id, cb) { //cb : function(err, val);
  var post_ss = new fdb.Subspace(['posts', post_id]);
  db.doTransaction(function(tr, inCB){

    tr.get(post_ss.pack(['image']), function(err, val) {
      if(err) return inCB(err);
      return inCB(null, _unpack(val));
    });

  }, cb);
};


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

        tr.set(user_ss.pack(['indetifications', post_id]), _pack(iden));

        inCB(null, true);

      });
    });


  });
};

//get a user's credibility
function get_user_credibilty(user_id, cb) { //cb : function(err, val);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {
    tr.get(user_ss.pack(['credibility']), function(err, val) {
      if(err) return inCB(err);
      return inCB(null, _unpack(val));
    });
  }, cb);
};

function set_user_credibility(user_id, new_credibility) {
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {
    tr.set(user_ss.pack(['credibility']), _pack(new_credibility));
  });
}

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

function get_user_identifications(user_id, cb) {//cb : function(err, val);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(user_ss.pack(['indetifications']));
    it.toArray(function(err, val) {
      if(err) return inCB(err);
      inCB(null, val.map(function(t) {return {post:user_ss.subspace(['indetifications']).unpack(t.key)[0], identification:_unpack(t.value)};}));
    });
  }, cb);
}
