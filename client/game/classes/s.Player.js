s.Player = new Class({
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
    else {
        // Setup camera: Chase view
        this.game.camera.position.set(0, 25, -250);
        this.game.camera.lookAt(new THREE.Vector3(0,0,0));
    }
  }
});
