s.Player = new Class({
  toString: 'Player',
  extend: s.Ship,

  construct: function(options) {
    this.camera = options.camera;
    this.name = options.name || '';

    // Root camera to the player's position
    this.root.add(this.camera);

    // Set default view mode
    this.setCameraViewMode();
  },

  setCameraViewMode: function(mode) {
    if (mode === 'firstPerson') {
        // Setup camera: Cockpit view
        // this.camera.position.set(0, 0, 0);
        this.firstPerson = true;
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
  }
});
