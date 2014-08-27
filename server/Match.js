var shortId = require('shortid');

var EventEmitter = require('events').EventEmitter;

/*
  Manage game logic
  Maintain a list of players and their positions
  Mainatin game state and broadcast changes
*/
function Match(options) {
  this.name = options.name;
  this.id = shortId.generate();

  // @todo support different game types
  this.type = options.type;

  // @todo support different maps
  // this.map = options.map;

  this.players = [];
}

Match.prototype = Object.create(EventEmitter.prototype);

Match.prototype.start = function() {
  // @todo Hook into loop
  // @todo Stop when time is up

  // Emit start event
  this.emit('start', this);
};

Match.prototype.end = function() {
  // @todo Unhook from loop

  // Emit end event
  this.emit('end', this);
};

Match.prototype.handle = function(eventName, player, data) {
  if (!data) {
    data = {};
  }

  data.id = player.socket.id;

  player.socket.broadcast.to(this.id).emit(eventName, data);
};

Match.prototype.join = function(player) {
  // Store player
  var index = this.players.indexOf(player);
  if (index !== -1) {
    console.error('Player %s tried to join match %s twice', player, this.id);
    return;
  }
  this.players.push(player);

  // Store the match
  player.match = this;

  // Join the room
  player.socket.join(this.id);

  // @todo Send map state

  // Send player list
  // @todo should this be sent as a list?
  this.players.forEach(function(otherPlayer) {
    player.socket.emit('joinMatch', otherPlayer.get('joinMatch'));

    player.socket.emit('joinTeam', otherPlayer.get('joinTeam'));

    player.socket.emit('state', otherPlayer.get('state'));
  });

  // Broadcast join that player has joined
  this.handle('joinMatch', player);

  console.log('Player %s has joined match %s', player.name, this.id);

  this.emit('playerJoined', this, player);
};

Match.prototype.leave = function(player) {
  // Leave the room
  player.socket.leave(this.id);

  player.match = null;

  // Remove player
  var index = this.players.indexOf(player);
  if (index === -1) {
    throw new Error('Requested to remove player from match, but player wasn\'t present!');
  }
  this.players.splice(index, 1);

  console.log('%s has left %s', player.name, this.name);

  this.emit('playerLeft', this, player);

  // End the match if everyone left
  if (match.players.length === 0) {
    this.end();
  }
};

module.exports = Match;
