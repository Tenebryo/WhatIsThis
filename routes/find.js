
/*
 * GET users listing.
 */

var fs = require('fs');

// some of this code won't be needed/will need to be changed with
// implementation of the db
exports.index = function(req, res){
  var fileNames = fs.readdirSync('public/images').slice(0, 10);
  for (var i = 0; i < fileNames.length; i++) {
    fileNames[i] = 'images/' + fileNames[i];
  };
  res.render('find', { files: fileNames});
};