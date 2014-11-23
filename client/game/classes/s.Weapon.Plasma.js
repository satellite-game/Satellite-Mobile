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
  var mass = this.mass;

  this.body = new CANNON.Body({
    mass: mass
  });
  this.body.addShape(shape);

  // var sphere = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({
  //   wireframe: false,
  //   color: this.color,
  //   emissive: new THREE.Color(this.color)
  // }));
  // this.root.add(sphere);

  this.init();
};

s.Weapon.Plasma.sound = new s.Sound({
  urls: ['game/sounds/laser.mp3'],
  volume: 0.5
});

s.Weapon.Plasma.prototype = Object.create(s.Weapon.prototype);
s.Weapon.Plasma.prototype.constructor = s.Weapon.Plasma;

s.Weapon.Plasma.prototype.handleCollision = function(event) {
  // Explosion animation
  new s.Explosion({
    game: this.game,
    color: this.color,
    position: this.body.position
  });

  this.trigger('collide', event);

  this.destructOnNextTick();
};

s.Weapon.Plasma.prototype.mass = 1;
s.Weapon.Plasma.prototype.damage = 10;
s.Weapon.Plasma.prototype.flightTime = 4000;
s.Weapon.Plasma.prototype.scale = new THREE.Vector3(50, 50, 1.0);
s.Weapon.Plasma.prototype.impulse = 5000;

s.Weapon.Plasma.prototype.colors = {
  human: 0x157ADF,
  alien: 0xDF1A00
};
