var path = require('path');
var express = require('express');
var app = express();
var errorHandler = require('errorhandler');
var port = parseInt(process.env.PORT, 10) || 8000;

var staticPath = path.join(__dirname, '..' , 'client');

app.get('/', function (req, res) {
  res.redirect('/index.html');
});

app.use(express.static(staticPath));
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

app.listen(port);

console.log('Serving %s on port %d', staticPath, port);
