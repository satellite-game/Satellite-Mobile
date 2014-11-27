s.Weapon.Laser = function(options) {
  s.EventEmitter.call(this, options);

  // Handle parameters
  this.color = this.colors[options.team];

  var geometry = new THREE.CylinderGeometry(this.width, this.width, this.length, 8);

  var material = new THREE.MeshBasicMaterial({
    color: this.color,
    opacity: 0.75,
    transparent: true
  });

  this.root = new THREE.Mesh(geometry, material);

  this.root.rotation.x = Math.PI/2;
  this.root.position.copy(options.position);
  this.root.position.z += this.length/2;
  this.root.visible = false; // Start hidden
};

s.Weapon.Laser.prototype = Object.create(s.EventEmitter.prototype);
s.Weapon.Laser.prototype.constructor = s.Weapon.Laser;

s.Weapon.Laser.prototype.width = 0.75;
s.Weapon.Laser.prototype.length = 10000;
s.Weapon.Laser.prototype.mass = 0;
s.Weapon.Laser.prototype.damage = 5;

s.Weapon.Laser.prototype.colors = {
  human: 0x157ADF,
  alien: 0xDF1A00
};
