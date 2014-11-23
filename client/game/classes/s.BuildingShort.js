s.BuildingShort = function(options) {
  s.GameObject.call(this, options);

  var geometry = s.models.human_building_short.geometry;
  var materials = s.models.human_building_short.materials;

  this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  // Cannon.js
  var shape = new CANNON.Box(new CANNON.Vec3(100, 100, 100));
  var mass = 0; // Fixed body

  this.body = new CANNON.Body({
    mass: mass
  });
  this.body.addShape(shape);

  // Hitbox
  // var cube = new THREE.BoxHelper();
  // cube.material.color.setRGB(1, 0, 0);
  // cube.scale.set(100, 100, 100);
  // this.root.add(cube);

  this.init();
};

s.BuildingShort.className = 'BuildingShort';

s.BuildingShort.prototype = Object.create(s.GameObject.prototype);
s.BuildingShort.prototype.constructor = s.BuildingShort;

s.BuildingShort.prototype.name = 'Moon Base Short';
