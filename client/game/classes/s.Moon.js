s.Moon = function(options) {
  s.GameObject.call(this, options);

  var geometry = new THREE.SphereGeometry(this.radius, 32, 32);
  var material = new THREE.MeshPhongMaterial({
    color: this.color,
    map: s.textures.moon
  });

  this.root = new THREE.Mesh(geometry, material);
  // this.root.receiveShadow = true; // Shadows aren't performant on iOS

  // Use a slightly larger radius as CANNON's units don't perfectly match THREE's
  var hitBox = new CANNON.Sphere(this.radius + 10);

  // Fixed body
  var mass = 0;

  // Create rigid body
  this.body = new CANNON.RigidBody(mass, hitBox);
};

s.Moon.prototype = Object.create(s.GameObject.prototype);

s.Moon.prototype.name = 'Moon';

// Show hitboxes if true 
s.Moon.prototype.debug = false;

// Make the moon a bit red
s.Moon.prototype.color = 0x704030;

// Make the moon a bit red
s.Moon.prototype.radius = 8000;

// Moon can take some serious hits
s.Moon.prototype.hp = 500000;
