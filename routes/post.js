
/*
 * GET users listing.
 */

var fdb = require('fdb').apiVersion(300);
var db = fdb.open();
var fs = require('fs');

// called on GET request
exports.index = function(req, res){
	res.render("post");
  //res.send("post something");
};

// called on POST request 
exports.submit = function(req, res){

  res.redirect('/');
//
//  for (var i in req) {
//    console.log(i);
//  }

  console.log(req.headers);

  console.log(req.body);
  console.log(req.files);

  var username = req.body.firstname;
  var filename = req.files.fileToUpload.name;

  new_post(username, function(e, v) {
    if (!e) {
      set_post_image(v, filename);
    }
  }); 
};

/*
exports.form = function(req, res) {

  res.send('You sent ' + req.body.test_file)

  get_user_identifications(3301, function(e, v) {
    if (!e) console.log(v);
  });
*/

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
      return inCB(null, v);
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

//get a user's credibility. user.js?
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

// should this go in user.js?
function get_user_identifications(user_id, cb) {//cb : function(err, val);
  var user_ss = new fdb.Subspace(['users', user_id]);
  db.doTransaction(function(tr, inCB) {
    var it = tr.getRangeStartsWith(user_ss.pack(['indentifications']));
    it.toArray(function(err, val) {
      if(err) return inCB(err);
      inCB(null, val.map(function(t) {return {post:user_ss.subspace(['indentifications']).unpack(t.key)[0], identification:_unpack(t.value)};}));
    });
  }, cb);
}
