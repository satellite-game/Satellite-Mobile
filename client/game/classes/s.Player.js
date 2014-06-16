s.Player = new Class({
  toString: 'Player',
  extend: s.Ship,

  viewModes: [
    'chase',
    'cockpit',
    'front',
    'overhead'
  ],

  construct: function(options) {
    this.camera = options.camera;
    this.name = options.name || '';

    // Root camera to the player's position
    this.root.add(this.camera);

    // Set default view mode
    this.setCameraViewMode();

    this.curViewMode = 0;

    // Throttle camera view mode calls
    this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 250, { leading: true, trailing: false});
  },

  fire: function() {
    // Don't call superclass method to avoid overhead

    // Fire some plasma
    var now = s.game.now;
    if (now - this.lastFireTime > s.Ship.fireInterval) {
      this.root.updateMatrixWorld();

      new s.WeaponPlasma({
        game: s.game,
        velocity: this.body.velocity,
        position: this.offsetGunLeft.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld),
        rotation: this.root.quaternion,
        team: this.team
      });

      new s.WeaponPlasma({
        game: s.game,
        velocity: this.body.velocity,
        position: this.offsetGunRight.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld),
        rotation: this.root.quaternion,
        team: this.team
      });

      this.lastFireTime = now;
    }
  },

  setCameraViewMode: function(mode) {
    if (mode === 'cockpit') {
        this.camera.position.set(0, 0, 0);
    }
    else if (mode === 'front') {
        this.game.camera.position.set(0, 35, 300);
        this.game.camera.lookAt(new THREE.Vector3(0,0,0));
    }
    else if (mode === 'overhead') {
        this.game.camera.position.set(0, 250, 0);
        this.game.camera.lookAt(new THREE.Vector3(0,0,0));
    }
    else {
        // Chase
        this.game.camera.position.set(0, 25, -250);
        this.game.camera.lookAt(new THREE.Vector3(0,25,0));
    }
  },

  cycleCameraViewMode: function() {
    this.curViewMode = (this.curViewMode + 1) % this.viewModes.length;
    this.setCameraViewMode(this.viewModes[this.curViewMode]);
  }
});
