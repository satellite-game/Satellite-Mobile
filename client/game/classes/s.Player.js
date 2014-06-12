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

    this.cycleCameraViewMode = s.util.throttle(this.cycleCameraViewMode, 500, { leading: true, trailing: false});
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
        this.game.camera.lookAt(new THREE.Vector3(0,0,0));
    }
  },

  cycleCameraViewMode: function() {
    this.curViewMode = (this.curViewMode + 1) % this.viewModes.length;
    this.setCameraViewMode(this.viewModes[this.curViewMode]);
  }
});
