s.Player = function(options) {
  s.EventEmitter.call(this);

  this.game = options.game;
  this.camera = options.camera;

  this._viewModeIndex = 0;

  // Set default view mode
  this.setCameraViewMode();

  // Throttle camera view mode calls
  this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 250, { leading: true, trailing: false});

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
    this.ship.destruct();
  }

  // Store team and ship class
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
    id: this.id,
    name: this.name,
    team: team,
    shipClass: shipClass,
    position: s.game.map.spawn[team].pos,
    rotation: s.game.map.spawn[team].rot
  });

  // Let controls manipulate the ship
  this.controls.ship = this.ship;

  // Bubble ship fire / hit events
  var self = this;
  this.ship.on('fireWeapon', function(packet) {
    self.trigger('fireWeapon', packet);
  });

  this.ship.on('weaponHit', function(event) {
    var body = event.body;
    if (body && body.instance) {
      // console.log('Plasma hit '+body.instance.id);

      self.trigger('weaponHit', {
        targetId: body.instance.id,
        weapon: 'plasma' // @todo don't hardcode
      });
    }
    else {
      console.error('Hit something without an instance', event);
    }
  });

  // Show the HUD
  this.hud.show();

  // Root camera to the player's position and reset position
  this.ship.root.add(this.camera);
  this.setCameraViewMode(this.viewMode);

  // Set initial state
  this.ship.getStatePacket();
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
