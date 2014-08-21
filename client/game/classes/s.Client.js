s.Client = function(options) {
  var players = this.players = {};
  var socket = this.socket = io();
  var player = this.player = options.player;

  player.on('fire', this.send.bind(this, 'fire'));
  // player.on('hit', this.send.bind(this, 'hit'));
  // player.on('killed', this.send.bind(this, 'killed'));

  socket.on('join', handleJoin);
  socket.on('state', handleState);
  socket.on('fire', handleFire);
  socket.on('hit', handleHit);
  socket.on('killed', handleKilled);
  socket.on('leave', handleLeave);

  // Join the default room
  this.join('default');

  function handleJoin(data) {
    console.log('Player %s (%s) has joined', data.name, data.id);

    players[data.id] = {
      name: data.name,
      ship: new s.Ship({
        name: data.name,
        shipClass: 'human_ship_heavy',
        team: data.team || 'rebel',
        game: s.game
      })
    };
  }

  function handleState(data) {
    var player = players[data.id];

    if (player) {
      // console.log('Got state update from %s (%s)', data.name, data.id);

      // Set object state
      player.ship.setStateFromPacket(data);

      // Apply other variables
      player.ship.thrustImpulse = data.th;
    }
    else {
      console.error('Got state update for player that doesn\'t exist: %s (%s)', data.name, data.id);
    }
  }

  function handleFire(data) {
    var player = players[data.id];

    if (player) {
      // console.log('Got fire from %s (%s)', data.name, data.id);

      // Convert positions
      data.pos[0] = s.Client.packetItemToObj(data.pos[0]);
      data.pos[1] = s.Client.packetItemToObj(data.pos[1]);
      data.rot = s.Client.packetItemToObj(data.rot);
      data.vl = s.Client.packetItemToObj(data.vl);

      player.ship.fire(data);
    }
    else {
      console.error('Got fire player that doesn\'t exist: %s (%s)', data.name, data.id);
    }
  }

  function handleHit(data) {
    // @todo flash HUD
  }

  function handleKilled(data) {
    // @todo show message
  }

  function handleLeave(data) {
    console.log('Player %s (%s) has left', data.name, data.id);
    var otherPlayer = players[data.id];

    if (otherPlayer) {
      otherPlayer.ship.destructOnNextTick();

      players[data.id] = null;
    }
  }
};

s.Client.objToPacketItem = function objToPacketItem(obj) {
  if (obj instanceof THREE.Vector3 || obj instanceof CANNON.Vec3) {
    return [obj.x, obj.y, obj.z];
  }
  else if (obj instanceof THREE.Quaternion || obj instanceof CANNON.Quaternion) {
    return [obj.x, obj.y, obj.z, obj.w];
  }
  else if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      obj[i] = objToPacketItem(obj[i]);
    }
    return obj;
  }
  else {
    return obj;
  }
};

s.Client.packetItemToObj = function packetItemToObj(obj) {
  if (Array.isArray(obj)) {
    if (obj.length === 3) {
      return new THREE.Vector3(obj[0], obj[1], obj[2]);
    }
    else if (obj.length === 4) {
      return new THREE.Quaternion(obj[0], obj[1], obj[2], obj[3]);
    }
    else {
      console.warn('Invalid packet item: ', obj);
      return obj;
    }
  }
  else {
    return obj;
  }
};

s.Client.prototype.join = function(matchName, playerName) {
  // @todo handle join failures
  this.send('join', {
    name: this.player.name,
    matchName: matchName
  });

  this.matchName = matchName;
};

s.Client.leave = function() {
  // @todo handle leave failures
  this.send('leave', this.matchName);
};

s.Client.prototype.update = function(now, delta) {
  this.send('state', this.player.getState());
};

s.Client.prototype.send = function(eventName, data) {
  // Convert objects into arrays
  for (var prop in data) {
    data[prop] = s.Client.objToPacketItem(data[prop])
  }

  this.socket.emit(eventName, data);
};
