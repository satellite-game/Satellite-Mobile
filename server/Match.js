var shortId = require('shortid');
var Maps = require('./maps');
var EventEmitter = require('events').EventEmitter;

/*
  Manage game logic
  Maintain a list of players and their positions
  Mainatin game state and broadcast changes
*/
function Match(options) {
  this.name = options.name;
  this.id = options.id || shortId.generate();

  this.endWhenEmpty = typeof options.endWhenEmpty === 'boolean' ? options.endWhenEmpty : true;

  // @todo support different game types
  this.type = options.type;

  this.players = [];

  // Load the map
  this.loadMap(options.map);
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

Match.prototype.loadMap = function(mapName) {
  var map = Maps[mapName];

  if (!map) {
    console.error('Map %s not found', mapName);
    return;
  }

  this.map = map;
}

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
  // Store the match
  player.match = this;

  // Join the room
  player.socket.join(this.id);

  // @todo Send map state
  player.socket.emit('map', this.map);

  // Send player list
  // @todo should this be sent as a list?
  this.players.forEach(function(otherPlayer) {
    player.socket.emit('joinMatch', otherPlayer.get('joinMatch'));

    player.socket.emit('joinTeam', otherPlayer.get('joinTeam'));

    player.socket.emit('state', otherPlayer.get('state'));
  });

  // Add to player list
  this.players.push(player);

  // Broadcast join that player has joined
  this.handle('joinMatch', player, {
    name: player.name
  });

  // Tell the player they have joined the match
  player.socket.emit('matchJoined');

  console.log('Player %s has joined match %s', player, this.id);

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

  // Notify that player has left
  player.socket.broadcast.to(this.id).emit('leaveMatch', { id: player.socket.id });

  console.log('Player %s has left match %s', player.socket.id, this.id);

  this.emit('playerLeft', this, player);

  // End the match if everyone left
  if (this.endWhenEmpty && this.players.length === 0) {
    this.end();
  }
};

module.exports = Match;
