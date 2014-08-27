var path = require('path');
var express = require('express');
var app = express();
var httpServer = require('http').Server(app);
var errorHandler = require('errorhandler');
var io = require('socket.io')(httpServer);

// Configuration
var port = parseInt(process.env.PORT, 10) || 3000;
var staticPath = path.join(__dirname, '..' , 'client');

// Setup express
app.use(express.static(staticPath));
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

// Start the HTTP server
httpServer.listen(port, function(){
  console.log('Serving %s on port %d', staticPath, port);
});

// Start the game server
require('./Server.js')(io);
