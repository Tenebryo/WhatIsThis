/**
 * Module dependencies.
 */

var express = require('express');
//var busboy = require('connect-busboy');
var multer = require('multer');

// routing requirements
var routes = require('./routes');
var user = require('./routes/user');
var post = require('./routes/post');
var find = require('./routes/find');

var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(multer({dest:'./data/uploads', onFileUploadComplete:function(file) {
  console.log('Upload complete: ', file);
},
onFileUploadStart: function(file) {
  console.log('Upload start: ', file);
}
}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


//app.use(express.bodyParser({defer: true}));
//app.use(busboy())

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routes
app.get('/', routes.index);
app.get('/post', post.index);
app.post('/upload', post.submit);
app.get('/find', find.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});