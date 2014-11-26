s.Client = function(options) {
  var self = this;
  var game = this.game = options.game;
  var player = this.player = options.player;
  
  // Map of player IDs to player objects
  var players = this.players = {};

  // Socket connection
  var socket = this.socket = io();

  // Rebroadcast events
  player.on('fireWeapon', this.send.bind(this, 'fireWeapon'));
  player.on('weaponHit', this.send.bind(this, 'weaponHit'));

  // Listen to events coming from the server
  socket.on('map', handleMap);

  socket.on('joinMatch', handleJoinMatch);
  socket.on('joinTeam', handleJoinTeam);
  socket.on('fireWeapon', handleFireWeapon);
  socket.on('state', handleState);
  socket.on('gameOver', handleGameOver);
  socket.on('respawn', handleRespawn);
  socket.on('leaveMatch', handleLeaveMatch);

  socket.on('noMatch', handleNoMatch);

  socket.on('playerHit', handlePlayerHit);
  socket.on('itemHit', handleItemHit);

  socket.on('playerDestroyed', handlePlayerDestroyed);
  socket.on('itemDestroyed', handleItemDestroyed);

  socket.on('matchJoined', handleMatchJoined);

  // Bind to game loop
  this.game.hook(this.update.bind(this));

  function handleNoMatch(data) {
    // Just join the default match for now
    self.joinMatch('default', player.name);

    // Respawn immediately
    handleRespawn();
  }

  function handleMatchJoined(data) {
    var name = window.location.hash || 'Player '+Date.now().toString().slice(-5);
    var team = window.location.hash.indexOf('alien') !== -1 ? 'alien': 'human';
    var shipClass = window.location.hash.indexOf('light') !== -1 ? 'light': 'heavy';

    // Store the server's ID for us
    player.id = data.id;

    // Join game
    player.joinTeam(team, shipClass);
  }

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
    if (!data.team || !data.cls) {
      console.error('Got invalid join packet:', data);
      return;
    }

    var player = players[data.id];

    console.log('Player %s has joined the the %s team as a %s', player.name, data.team, data.cls);

    player.ship = new s.Ship({
      id: data.id,
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
      // console.log('Player %s fired %s', data.id, data.weapon);

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

  function handlePlayerHit(data) {
    // console.log('Player got hit!', data);
    if (data.targetId === player.id) {
      // @todo flash HUD
      // player.hud.flash();

      // Update HP
      // @todo do this with a method so we can react
      player.ship.hp = data.hp;
    }
    else {
      var targetPlayer = players[data.targetId];

      if (targetPlayer) {
        // Update HP
        targetPlayer.hp = data.hp;
      }
      else {
        console.error('Got hit for untracked player %s', data.targetId);
      }
    }
  }

  function handleItemHit(data) {
    // console.log('Map item got hit!', data);
    // Update HP
    s.game.map.items[data.targetId].hp = data.hp;
  }

  function handlePlayerDestroyed(data) {
    // Do nothing, they'll respawn automatically
    // @todo when to HP updates happen?
    console.log('Player was destroyed!', data);
  }

  function handleItemDestroyed(data) {
    console.log('Map item was destroyed!', data);

    // Explode & destruct
    s.game.map.items[data.targetId].explode();

    // Remove from item list
    s.game.map.items[data.targetId] = null;
  }

  function handleGameOver(data) {
    console.warn('Game over: %s', data.reason);

    // Respawn
    handleRespawn(data);
  }

  function handleRespawn(data) {
    // Reset HP
    player.ship.hp = player.constructor.prototype.hp;

    // Respawn
    player.ship.setState(
      s.game.map.spawn[player.team].pos,
      s.game.map.spawn[player.team].rot,
      new THREE.Vector3(),
      new THREE.Vector3()
    );
  }

  function handleLeaveMatch(data) {
    console.log('Player %s has left the match', data.id);
    var otherPlayer = players[data.id];

    if (otherPlayer && otherPlayer.ship) {
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

s.Client.prototype.leaveMatch = function() {
  // @todo handle leave failures
  this.send('leaveMatch', this.matchName);
};

s.Client.prototype.joinTeam = function() {
  // @todo handle join failures
  this.send('joinTeam', {
    team: this.player.team,
    cls: this.player.shipClass
  });
};

s.Client.prototype.leaveTeam = function() {
  this.send('leaveTeam');

  // Get rid of the ship object
  this.ship.destruct();

  this.ship = null;
};

s.Client.prototype.update = function(now, delta) {
  if (this.player.ship) {
    // Don't update if we don't have a ship
    this.send('state', this.player.ship.getStatePacket());
  }
};

s.Client.prototype.send = function(eventName, data) {
  // Convert objects into arrays
  for (var prop in data) {
    data[prop] = s.Client.objToPacketItem(data[prop])
  }

  this.socket.emit(eventName, data);
};
