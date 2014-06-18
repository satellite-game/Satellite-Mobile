s.Player = function(options) {
  s.Ship.call(this, options);

  this.camera = options.camera;
  this.name = options.name || '';

  // Root camera to the player's position
  this.root.add(this.camera);

  // Set default view mode
  this.setCameraViewMode();

  this.curViewMode = 0;

  // Throttle camera view mode calls
  this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 250, { leading: true, trailing: false});
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

    new s.Weapon.Plasma({
      game: s.game,
      velocity: this.body.velocity,
      position: this.offsetGunLeft.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld),
      rotation: this.root.quaternion,
      team: this.team
    });

    new s.Weapon.Plasma({
      game: s.game,
      velocity: this.body.velocity,
      position: this.offsetGunRight.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld),
      rotation: this.root.quaternion,
      team: this.team
    });

    this.lastFireTime = now;
  }
};

s.Player.prototype.setCameraViewMode = function(mode) {
  if (mode === 'cockpit') {
      this.camera.position.set(0, 0, 0);
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
      // Chase
      this.camera.position.set(0, 25, -250);
      this.camera.lookAt(new THREE.Vector3(0,25,0));
  }
};

s.Player.prototype.cycleCameraViewMode = function() {
  this.curViewMode = (this.curViewMode + 1) % this.viewModes.length;
  this.setCameraViewMode(this.viewModes[this.curViewMode]);
};
