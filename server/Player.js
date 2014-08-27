function Player(options) {
  // Store socket
  this.socket = options.socket;

  socket.on('joinTeam', handleJoinTeam);
  socket.on('leaveTeam', handleLeaveTeam);

  socket.on('state', handleState);
  socket.on('hitPlayer', handleHitPlayer);
  socket.on('fireWeapon', handleFire);

  function handleJoinTeam(data) {
    this.team = data.team;
    this.cls = data.cls;
    this.name = data.name;

    this.emit('joinTeam', {
      name: this.name,
      team: this.team,
      cls: this.cls
    });
  }

  function handleLeaveTeam() {
    this.team = null;
    this.cls = null;
    this.name = 'Unnamed';

    // Leave team
    this.emit('leaveTeam');
  }

  function handleState(data, interp) {
    // Update state
    if (data) {
      player.set(data);
    }

    var packet = player.get();
    packet.interp = typeof interp !== 'undefined' ? interp : true;

    // Notify players
    this.emit('state', packet);
  }

  function handleHitPlayer(data) {
    this.emit('hitPlayer', {
      victim: data.victim,
      weapon: data.weapon
    });
  }

  function handleFire(data) {
    this.emit('fireWeapon', {
      weapon: data.weapon,
      pos: data.pos,
      rot: data.rot,
      vl: data.vl
    });
  }

  this.set(options);
}

Player.emit = function(event, data) {
  // Check if we're in a match
  if (!this.match) {
    console.error('Player tried to send %s before joining a match', event, data);
    return;
  }

  // Pass to the match
  this.match.handle(event, this, data);
};

Player.prototype.toString = function() {
  return this.name;
};

Player.prototype.get = function() {
  return {
    id: this.socket.id,
    name: this.name,
    team: this.team,
    cls: this.cls,
    weapon: this.weapon,
    pos: this.pos,
    rot: this.rot,
    va: this.va,
    vl: this.vl,
    th: this.th
  };
};

Player.prototype.set = function(data) {
  this.name = data.name || this.name;
  this.team = data.team || this.team;
  this.cls = data.cls || this.cls;
  this.weapon = data.weapon || this.weapon;
  this.pos = data.pos || this.pos;
  this.rot = data.rot || this.rot;
  this.va = data.va || this.va;
  this.vl = data.vl || this.vl;
  this.th = data.th !== undefined ? data.th : this.th; // Handled differently as it's not an object
};

module.exports = Player;
