s.Client = function(options) {
  var game = this.game = options.game;
  var player = this.player = options.player;
  
  // Map of player IDs to player objects
  var players = this.players = {};

  // Socket connection
  var socket = this.socket = io();

  player.on('fire', this.send.bind(this, 'fireWeapon'));

  socket.on('map', handleMap);

  socket.on('joinMatch', handleJoinMatch);
  socket.on('joinTeam', handleJoinTeam);
  socket.on('fireWeapon', handleFireWeapon);
  socket.on('hitPlayer', handleHitPlayer);
  socket.on('state', handleState);
  socket.on('killed', handleKilled);
  socket.on('leaveMatch', handleLeaveMatch);

  socket.on('matchJoined', function() {
    var name = window.location.hash || 'Player '+Date.now().toString().slice(-5);
    var team = window.location.hash.indexOf('alien') !== -1 ? 'alien': 'human';
    var shipClass = window.location.hash.indexOf('light') !== -1 ? 'light': 'heavy';

    // Join game
    player.joinTeam(team, shipClass);
  });

  // Bind to game loop
  this.game.hook(this.update.bind(this));

  function handleMap(map) {
    var items = map.items;

    map.spawn.human.pos = s.Client.packetItemToObj(map.spawn.human.pos);
    map.spawn.human.rot = s.Client.packetItemToObj(map.spawn.human.rot);
    map.spawn.alien.pos = s.Client.packetItemToObj(map.spawn.alien.pos);
    map.spawn.alien.rot = s.Client.packetItemToObj(map.spawn.alien.rot);

    for (var id in items) {
      var item = items[id];

      item.pos = s.Client.packetItemToObj(item.pos);
      item.rot = s.Client.packetItemToObj(item.rot);
    }

    game.setMap(map);
  }

  function handleJoinMatch(data) {
    console.log('Player %s has entered the match', data.name);

    players[data.id] = {
      id: data.id,
      name: data.name
    };
  }

  function handleJoinTeam(data) {
    var player = players[data.id];

    console.log('Player %s has joined the the %s team as a %s', player.name, data.team, data.cls);

    player.ship = new s.Ship({
      shipClass: data.cls,
      team: data.team,
      game: game
    });
  }

  function handleState(data) {
    var player = players[data.id];

    if (player) {
      if (player.ship) {
        // console.log('Got state update from %s (%s)', data.name, data.id);

        // Set object state
        player.ship.setStateFromPacket(data);

        // Apply other variables
        player.ship.thrustImpulse = data.th;
      }
      else {
        console.error('Got state update from player %s, but player does not have a ship', player.id);
      }
    }
    else {
      console.error('Got state update for player %s, but player does not exist', data.id);
    }
  }

  function handleFireWeapon(data) {
    var player = players[data.id];

    if (player) {
      console.log('Player %s fired %s', data.id, data.weapon);

      // Convert positions
      data.pos[0] = s.Client.packetItemToObj(data.pos[0]);
      data.pos[1] = s.Client.packetItemToObj(data.pos[1]);
      data.rot = s.Client.packetItemToObj(data.rot);
      data.vl = s.Client.packetItemToObj(data.vl);

      player.ship.spawnBullets(data);
    }
    else {
      console.error('Got fire from player %s, but player does not exist', data.id);
    }
  }

  function handleHitPlayer(data) {
    // @todo flash HUD
  }

  function handleKilled(data) {
    // @todo show message
  }

  function handleLeaveMatch(data) {
    console.log('Player %s has left the match', data.id);
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

s.Client.prototype.joinMatch = function(matchId, playerName) {
  // @todo handle join failures
  this.send('joinMatch', {
    matchId: matchId,
    name: playerName
  });
};

s.Client.prototype.leaveTeam = function() {
  this.send('leaveTeam');
};

s.Client.prototype.joinTeam = function() {
  // @todo handle join failures
  this.send('joinTeam', {
    team: this.player.team,
    cls: this.player.shipClass
  });
};

s.Client.leaveMatch = function() {
  // @todo handle leave failures
  this.send('leaveMatch', this.matchName);
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
