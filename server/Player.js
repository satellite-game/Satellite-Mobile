function Player(options) {
  var player = this;

  // Store socket
  var socket = this.socket = options.socket;

  // Store ID for easy access
  this.id = socket.id;

  socket.on('joinTeam', handleJoinTeam);
  socket.on('leaveTeam', handleLeaveTeam);

  socket.on('state', handleState);
  socket.on('weaponHit', handleWeaponHit);
  socket.on('fireWeapon', handleFire);

  this.hp = 100;

  function handleJoinTeam(data) {
    player.team = data.team;
    player.cls = data.cls;

    player.emit('joinTeam', {
      team: player.team,
      cls: player.cls
    });
  }

  function handleLeaveTeam() {
    player.team = null;
    player.cls = null;
    player.name = 'Unnamed';

    // Leave team
    player.emit('leaveTeam');
  }

  function handleState(data, interp) {
    // Update state
    if (data) {
      player.set(data);
    }

    var packet = player.get();
    packet.interp = typeof interp !== 'undefined' ? interp : true;

    // Notify players
    player.emit('state', packet);
  }

  function handleWeaponHit(data) {
    if (!data) {
      console.error('Got player hit packet from player %s with no data!', player);
      return;
    }

    player.emit('weaponHit', {
      targetId: data.targetId,
      weapon: data.weapon,
      amount: 10 // @todo don't hardcode
    });
  }

  function handleFire(data) {
    if (!data) {
      console.error('Got fire packet from player %s with no data!', player);
      return;
    }
    player.emit('fireWeapon', {
      weapon: data.weapon,
      pos: data.pos,
      rot: data.rot,
      vl: data.vl
    });
  }

  this.set(options);
}

Player.prototype.emit = function(event, data) {
  // Check if we're in a match
  if (!this.match) {
    console.error('Player %s tried to send %s before joining a match', this, event);
    return;
  }

  // Pass to the match
  this.match.handle(event, this, data);
};

Player.prototype.toString = function() {
  return this.name || this.socket.id;
};

Player.prototype.takeHit = function(amount, attacker) {
  this.hp -= amount;
};

Player.prototype.respawn = function() {
  this.hp = 100;

  // @todo server provides spawn location
  this.socket.emit('respawn');
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
