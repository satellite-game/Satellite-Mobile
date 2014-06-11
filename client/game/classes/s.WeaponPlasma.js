s.WeaponPlasma = new Class({
  toString: 'WeaponPlasma',

  extend: s.Projectile,

  velocity: 5000,

  scale: new THREE.Vector3(50, 50, 1.0),

  colors: {
    alliance: 0x00F2FF,
    rebel: 0xFF0000,
    enemy: 0xFF0000
  },

  construct: function(options){
    // Handle parameters
    this.color = this.colors[options.team];

    // Cannon.js
    var shape = new CANNON.Sphere(10);
    var mass = 1;
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // A 3D root object
    this.root = new THREE.Object3D();

    // With a sprite in it
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: s.textures.particle,
      useScreenCoordinates: false,
      blending: THREE.AdditiveBlending,
      color: this.color
    }));
    this.root.add(sprite);

    // Scale appropriately
    // Does not affect hit area
    sprite.scale.copy(this.scale);
  }
});
