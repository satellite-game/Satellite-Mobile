s.Player = function(options) {
  s.Ship.call(this, options);

  this.camera = options.camera;
  this.name = options.name || '';

  // Root camera to the player's position
  this.root.add(this.camera);

  // Set default view mode
  this.setCameraViewMode();

  this._viewModeIndex = 0;

  // Throttle camera view mode calls
  this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 250, { leading: true, trailing: false});

  // State packet
  // We'll re-use this object and its arrays to avoid constant object allocation/deallocation
  this.state = {
    pos: [0, 0, 0],
    rot: [0, 0, 0, 0],
    va: [0, 0, 0],
    vl: [0, 0, 0]
  };

  // Set initial state
  this.getState();
};

s.Player.prototype = Object.create(s.Ship.prototype);

s.Player.prototype.viewModes = [
  'chase',
  'cockpit',
  'front',
  'overhead'
];

s.Player.prototype.fire = function() {
  // Don't call superclass method to avoid overhead
  // Fire some plasma
  var now = s.game.now;
  if (now - this.lastFireTime > s.Ship.fireInterval) {
    this.root.updateMatrixWorld();

    var leftPos = this.offsetGunLeft.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld);
    var rightPos = this.offsetGunRight.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld);

    new s.Weapon.Plasma({
      game: s.game,
      velocity: this.body.velocity,
      position: leftPos,
      rotation: this.root.quaternion,
      team: this.team
    });

    new s.Weapon.Plasma({
      game: s.game,
      velocity: this.body.velocity,
      position: rightPos,
      rotation: this.root.quaternion,
      team: this.team
    });

    s.Weapon.Plasma.sound.play();

    this.lastFireTime = now;

    this.trigger('fire', {
      vl: this.body.velocity,
      pos: leftPos,
      rot: this.root.quaternion,
    });

    this.trigger('fire', {
      vl: this.body.velocity,
      pos: rightPos,
      rot: this.root.quaternion,
    });
  }
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
  var pos = this.root.position;
  var rot = this.root.quaternion;
  var va = this.body.angularVelocity;
  var vl = this.body.velocity;

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

  return this.state;
};
