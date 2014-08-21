s.Moon = function(options) {
  s.GameObject.call(this, options);

  var geometry = s.models.phobos_hifi.geometry;
  var materials = s.models.phobos_hifi.materials;

  materials[0].color.setHex(this.color);

  this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  // Cannon.js
  var hitBoxes = [
    [0, 0, 0, 5900],
    [-3540, -500, -100, 3540],
    [3430, -500, 50, 4720],
    [-1900, -750, 1250, 4500],
    [0, -50, 1650, 4500],
    [-1342, -807, -2519, 4500],
    [3000, -500, -2900, 3500],
    [800, 700, -3600, 3500],
    [-742, 1590, -1481, 3750],
    [1938, 2432, -2189, 2500]
  ];

  var compound = new CANNON.Compound();
  for (var i = 0; i < hitBoxes.length; i++) {
    var x = hitBoxes[i][0];
    var y = hitBoxes[i][1];
    var z = hitBoxes[i][2];
    var size = hitBoxes[i][3] * 0.80; // Resize the hitboxes
    var hitBox = new CANNON.Sphere(size);
    compound.addChild(hitBox, new CANNON.Vec3(x, y, z));

    if (this.debug) {
      // Match size of real hit box
      var boxSize = size * 1.10;

      var sphere = new THREE.Mesh(new THREE.SphereGeometry(boxSize), new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 'red'
      }));

      sphere.position = new THREE.Vector3(x, y, z);
      this.root.add(sphere);
    }
  }

  // Fixed body
  var mass = 0;

  // Create rigid body from compound body
  var body = this.body = new CANNON.RigidBody(mass, compound);
};

s.Moon.prototype = Object.create(s.GameObject.prototype);

s.Moon.prototype.name = 'Moon';

// Show hitboxes if true 
s.Moon.prototype.debug = false;

// Make the moon a bit red
s.Moon.prototype.color = 0x704030;

// Moon can take some hits
s.Moon.prototype.hp = 500000;
