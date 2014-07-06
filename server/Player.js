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
      socket.broadcast.to(player.matchName).emit('join', { name: player.name });

      // Broadcast a move event, but don't interpolate
      handleState(null, false);
    }
  }

  function handleLeave(data) {
    // Leave room
    if (MatchManager.leave(data.matchName, player)) {
      socket.broadcast.to(player.matchName).emit('leave', { name: player.name });
    }
  }

  function handleDisconnect() {
    // Destroy player?
    // Leave room
    MatchManager.leave(player);
  }

  function handleState(data, interp) {
    // Update state
    if (data) {
      player.set(data);
    }

    var packet = player.get();
    packet.interp = typeof interp !== 'undefined' ? interp : true;

    // Notify players
    socket.broadcast.to(player.matchName).emit('move', packet);
  }

  function handleHit(data) {
    socket.broadcast.to(player.matchName).emit('hit', {
      otherPlayerName: data.otherPlayerName,
      yourName: player.name
    });

    socket.emit('hit', {
      otherPlayerName: data.otherPlayerName,
      yourName: player.name
    });
  }

  function handleKilled(data) {
    socket.broadcast.to(player.matchName).emit('killed', {
      killed: player.name,
      killer: data.killer
    });
  }

  function handleFire(data) {
    socket.broadcast.to(player.matchName).emit('fire', {
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
    name: this.name,
    pos: this.pos,
    rot: this.rot,
    va: this.va,
    vl: this.vl
  };
};

Player.prototype.set = function(data) {
  this.name = data.name || this.name;
  this.pos = data.pos || this.pos;
  this.rot = data.rot || this.rot;
  this.va = data.va || this.va;
  this.vl = data.vl || this.vl;
};

module.exports = Player;

