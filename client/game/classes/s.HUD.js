s.HUD = function(options) {
  this.game = options.game;

  this.crosshairs = new THREE.Sprite(new THREE.SpriteMaterial({
    map: s.textures.crosshairs,
    useScreenCoordinates: false,
    blending: THREE.AdditiveBlending,
    color: 0x00FF00
  }));

  this.game.camera.add(this.crosshairs);

  this.crosshairs.position.setZ(-30);
};

