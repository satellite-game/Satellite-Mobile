s.Player = new Class({
  extend: s.Ship,
  construct: function(options) {
    this.game = options.game;
    this.camera = options.camera;
    this.HUD = options.HUD;
    this.firstPerson = false;
    this.name = options.name || '';
    this.initialize(options);

    this.root.castShadow = true;

    // Root camera to the player's position
    this.root.add(this.camera);

    // Setup camera: Cockpit view
    // this.camera.position.set(0, 0, 0);

    // Setup camera: Chase view
    this.game.camera.position.set(0, 35, -250);
    this.game.camera.lookAt(new THREE.Vector3(0,0,0));
  }
});
