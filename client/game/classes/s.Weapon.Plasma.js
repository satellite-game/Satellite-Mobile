s.Weapon.Plasma = function(options) {
  s.Weapon.call(this, options);

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
};

s.Weapon.Plasma.prototype = Object.create(s.Weapon.prototype);

s.Weapon.Plasma.prototype.init = function() {
  s.Weapon.prototype.init.call(this);

  this.game.sound.play('laser', 0.050);
};

s.Weapon.Plasma.prototype.handleCollision = function(event) {
  // Explosion animation
  new s.Explosion({
    game: this.game,
    position: this.body.position
  });

  this.trigger('collide', event);

  this.destructOnNextTick();
};

s.Weapon.Plasma.prototype.damage = 10;
s.Weapon.Plasma.prototype.flightTime = 4000;
s.Weapon.Plasma.prototype.scale = new THREE.Vector3(50, 50, 1.0);
s.Weapon.Plasma.prototype.velocity = 5000;

s.Weapon.Plasma.prototype.colors = {
  alliance: 0x157ADF,
  rebel: 0xFF0000,
  enemy: 0xFF0000
};
