s.Moon = function(options) {
  s.GameObject.call(this, options);

  var geometry = new THREE.SphereGeometry(this.radius, 32, 32);

  // @perf: THREE.MeshPhongMaterial` can have a 95% impact when up close
  var material = new THREE.MeshLambertMaterial({
    color: this.color,
    map: s.textures.moon
  });

  this.root = new THREE.Mesh(geometry, material);

  // Create inner atmosphere
  // var innerAtmosphereGeometry = geometry.clone();
  // var innerAtmosphereMaterial = THREEx.createAtmosphereMaterial();
  // innerAtmosphereMaterial.uniforms.glowColor.value = new THREE.Color('white');
  // innerAtmosphereMaterial.uniforms.power.value = 6;
  // var innerAtomsphereMesh = new THREE.Mesh(innerAtmosphereGeometry, innerAtmosphereMaterial);
  // innerAtomsphereMesh.scale.multiplyScalar(1.01);
  // this.root.add(innerAtomsphereMesh);
  // this.innerAtmosphereMaterial = innerAtmosphereMaterial;

  // Create outer atmosphere
  var atompsphereGeometry = geometry.clone();
  var atmosphereMaterial = THREEx.createAtmosphereMaterial();
  atmosphereMaterial.side = THREE.BackSide;
  atmosphereMaterial.uniforms.coeficient.value = 0.5;
  atmosphereMaterial.uniforms.power.value = 10;
  atmosphereMaterial.uniforms.cutoff.value = 0.5;
  atmosphereMaterial.uniforms.glowColor.value = new THREE.Color(0.75, 0, 0);
  var atomsphereMesh = new THREE.Mesh(atompsphereGeometry, atmosphereMaterial);
  atomsphereMesh.scale.multiplyScalar(1.1);
  this.root.add(atomsphereMesh);
  this.atmosphereMaterial = atmosphereMaterial;

  THREEx.addAtmosphereMaterial2DatGui(atmosphereMaterial);

  if (s.config.shadows) {
    this.root.receiveShadow = true;
  }

  // Use a slightly larger radius as CANNON's units don't perfectly match THREE's
  var hitBox = new CANNON.Sphere(this.radius + 10);

  // Fixed body
  var mass = 0;

  this.body = new CANNON.Body({
    mass: mass
  });
  this.body.addShape(hitBox);

  this.init();
};

s.Moon.className = 'Moon';

s.Moon.prototype = Object.create(s.GameObject.prototype);
s.Moon.prototype.constructor = s.Moon;

s.Moon.prototype.name = 'Moon';

// Show hitboxes if true 
s.Moon.prototype.debug = false;

// Make the moon a bit red
s.Moon.prototype.color = 0x704030;

// Make the moon a bit red
s.Moon.prototype.radius = 8000;

// Moon can take some serious hits
s.Moon.prototype.hp = 500000;
