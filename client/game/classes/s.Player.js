s.Player = function(options) {
  s.EventEmitter.call(this);

  this.game = options.game;
  this.camera = options.camera;

  this._viewModeIndex = 0;

  // Set default view mode
  this.setCameraViewMode();

  // Throttle camera view mode calls
  this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 250, { leading: true, trailing: false});

  // State packet
  // We'll re-use this object and its arrays to avoid constant object allocation/deallocation
  this.state = {
    pos: [0, 0, 0],     // Position vector
    rot: [0, 0, 0, 0],  // Rotation quaternion
    va: [0, 0, 0],      // Angular velocity vector
    vl: [0, 0, 0],      // Linear velocity vector
    th: 0               // Thrust
  };

  // Communication
  this.client = new s.Client({
    game: this.game, 
    player: this
  });

  // HUD
  this.hud = new s.HUD({
    game: this.game,
    client: this.client,
    player: this
  });

  // Fly controls
  this.controls = new s.Controls({
    game: this.game,
    player: this,
    camera: this.camera
  });
};

s.Player.prototype = Object.create(s.EventEmitter.prototype);
s.Player.prototype.constructor = s.Player;

s.Player.prototype.joinMatch = function(matchId, playerName) {
  this.client.joinMatch(matchId, playerName);
  this.name = playerName;
};

s.Player.prototype.joinTeam = function(team, shipClass) {
  if (this.ship) {
    this.ship.destroy();
  }

  this.team = team;
  this.shipClass = shipClass;

  // Join the correct team
  this.client.joinTeam(
    team,
    shipClass
  );

  // Create the ship
  this.ship = new s.Ship({
    game: this.game,
    name: this.name,
    team: team,
    shipClass: shipClass,
    position: s.game.map.spawn[team].pos,
    rotation: s.game.map.spawn[team].rot
  });

  // Let controls manipulate the ship
  this.controls.ship = this.ship;

  // Bubble ship fire events
  var self = this;
  this.ship.on('fire', function(packet) {
    self.trigger('fire', packet);
  });

  // Root camera to the player's position
  this.ship.root.add(this.camera);

  // Set initial state
  this.getState();
};

s.Player.prototype.viewModes = [
  'chase',
  'cockpit',
  'front',
  'overhead'
];

s.Player.prototype.fire = function() {
  this.ship.fire();
};

s.Player.prototype.restoreViewMode = function() {
  var actualViewMode = this.viewMode;
  var oldViewMode = this.viewModes[this._viewModeIndex];
  if (oldViewMode !== actualViewMode) {
    // Don't bother calling methods if we're already in that mode
    this.setCameraViewMode(oldViewMode);
  }
};

s.Player.prototype.setCameraViewMode = function(mode) {
  if (mode === 'cockpit') {
    this.camera.position.set(0, 0, 0);
    this.camera.lookAt(new THREE.Vector3(0,0,25));
  }
  else if (mode === 'front') {
    this.camera.position.set(0, 35, 300);
    this.camera.lookAt(new THREE.Vector3(0,0,0));
  }
  else if (mode === 'overhead') {
    this.camera.position.set(0, 250, 0);
    this.camera.lookAt(new THREE.Vector3(0,0,0));
  }
  else {
    mode = 'chase';
    // Chase
    this.camera.position.set(0, 25, -250);
    this.camera.lookAt(new THREE.Vector3(0,25,0));
  }
  this.viewMode = mode;
};

s.Player.prototype.cycleCameraViewMode = function(previous) {
  // Change the current view mode index
  this._viewModeIndex = (this._viewModeIndex + 1) % this.viewModes.length;

  // Restore view mode, which resets the view mode to the current index in the cycle
  this.restoreViewMode();
};

s.Player.prototype.getState = function() {
  if (this.ship) {
    var pos = this.ship.root.position;
    var rot = this.ship.root.quaternion;
    var va = this.ship.body.angularVelocity;
    var vl = this.ship.body.velocity;

    this.state.pos[0] = pos.x;
    this.state.pos[1] = pos.y;
    this.state.pos[2] = pos.z;

    this.state.rot[0] = rot.x;
    this.state.rot[1] = rot.y;
    this.state.rot[2] = rot.z;
    this.state.rot[3] = rot.w;

    this.state.vl[0] = vl.x;
    this.state.vl[1] = vl.y;
    this.state.vl[2] = vl.z;

    this.state.va[0] = va.x;
    this.state.va[1] = va.y;
    this.state.va[2] = va.z;

    this.state.th = this.ship.thrustImpulse;
  }

  return this.state;
};
