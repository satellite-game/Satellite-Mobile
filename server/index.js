var path = require('path');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// var MatchManager = require('./MatchManager');
var Player = require('./Player');

var errorHandler = require('errorhandler');
var port = parseInt(process.env.PORT, 10) || 8000;

var staticPath = path.join(__dirname, '..' , 'client');

app.use(express.static(staticPath));

// @todo configure production mode error handling
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

server.listen(port, function(){
  console.log('Serving %s on port %d', staticPath, port);
});

io.sockets.on('connection', function (socket) {
  var ip = socket.handshake.address.address;
  console.log('New connection from %s', ip);

  var player = new Player({
    ip: ip,
    name: 'Unnamed',
    socket: socket
  });
});
