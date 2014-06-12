s.WeaponPlasma = new Class({
  toString: 'WeaponPlasma',

  extend: s.Projectile,

  velocity: 5000,

  scale: new THREE.Vector3(50, 50, 1.0),

  colors: {
    alliance: 0x157ADF,
    rebel: 0xFF0000,
    enemy: 0xFF0000
  },

  construct: function(options){
    // Handle parameters
    this.color = this.colors[options.team];

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

    // Cannon.js
    var shape = new CANNON.Sphere(5);
    var mass = 1;
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // var sphere = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({
    //   wireframe: false,
    //   color: this.color,
    //   emissive: new THREE.Color(this.color)
    // }));
    // this.root.add(sphere);

    var self = this;
    var handleCollision = function(evt) {
      // Explosion animation
      new s.Explosion({
        game: self.game,
        position: self.body.position
      });

      self.trigger('collide', evt);

      self.destructOnNextTick();
    };

    this.body.addEventListener('collide', handleCollision);
  }

  // @perf: Extremely slow on iOS
  // ,init: function() {
  //   this._super.call(this);
  //   this.game.sound.play('laser', 0.050);
  // }
});
