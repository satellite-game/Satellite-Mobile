var MatchManager = require('./MatchManager');

function Player(options) {
  var player = this;

  this.name = options.name || 'Unnamed';
  var socket = this.socket = options.socket;

  socket.on('join', handleJoin);

  socket.on('leave', handleLeave);

  socket.on('disconnect', handleDisconnect);

  socket.on('state', handleState);

  socket.on('hit', handleHit);

  socket.on('killed', handleKilled);

  socket.on('fire', handleFire);

  function handleJoin(data) {
    // Store name/state
    player.set(data);

    // Join a new room
    if (MatchManager.join(data.matchName, player)) {

      // Broadcast a move event, but don't interpolate
      handleState(null, false);
    }
  }

  function handleLeave() {
    // Leave room
    MatchManager.leave(player);
  }

  function handleDisconnect() {
    // @todo Destroy player object?
    // Same as handling leave without the matchName
    handleLeave();
  }

  function handleState(data, interp) {
    // Update state
    if (data) {
      player.set(data);
    }

    var packet = player.get();
    packet.interp = typeof interp !== 'undefined' ? interp : true;

    // Notify players
    socket.broadcast.to(player.matchName).emit('state', packet);
  }

  function handleHit(data) {
    socket.broadcast.to(player.matchName).emit('hit', {
      id: socket.id,
      otherPlayerName: data.otherPlayerName,
      yourName: player.name
    });

    socket.broadcast.to(player.matchName).emit('hit', {
      id: socket.id,
      otherPlayerName: data.otherPlayerName,
      yourName: player.name
    });
  }

  function handleKilled(data) {
    socket.broadcast.to(player.matchName).emit('killed', {
      id: socket.id,
      killed: player.name,
      killer: data.killer
    });
  }

  function handleFire(data) {
    socket.broadcast.to(player.matchName).emit('fire', {
      id: socket.id,
      name: player.name,
      // type: data.type, // @todo support other weapon types
      pos: data.pos,
      rot: data.rot,
      vl: data.vl
    });
  }
}

Player.prototype.toString = function() {
  return this.name
};

Player.prototype.get = function() {
  return {
    id: this.socket.id,
    name: this.name,
    pos: this.pos,
    rot: this.rot,
    va: this.va,
    vl: this.vl,
    th: this.th
  };
};

Player.prototype.set = function(data) {
  this.name = data.name || this.name;
  this.pos = data.pos || this.pos;
  this.rot = data.rot || this.rot;
  this.va = data.va || this.va;
  this.vl = data.vl || this.vl;
  this.th = data.th !== undefined ? data.th : this.th; // Handled differently as it's not an object
};

module.exports = Player;

