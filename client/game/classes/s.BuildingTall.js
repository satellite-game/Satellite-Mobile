s.BuildingTall = function(options) {
  s.GameObject.call(this, options);

  var geometry = s.models.human_building_tall.geometry;
  var materials = s.models.human_building_tall.materials;

  this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  // Cannon.js
  var shape = new CANNON.Box(new CANNON.Vec3(100, 500, 100));
  var mass = 0; // Fixed body

  this.body = new CANNON.Body({
    mass: mass
  });
  this.body.addShape(shape);

  // var cube = new THREE.BoxHelper();
  // cube.material.color.setRGB(1, 0, 0);
  // cube.scale.set(100, 500, 100);
  // this.root.add(cube);

  this.init();
};

s.BuildingTall.className = 'BuildingTall';

s.BuildingTall.prototype = Object.create(s.GameObject.prototype);
s.BuildingTall.prototype.constructor = s.BuildingTall;

s.BuildingTall.prototype.name = 'Moon Base Tall';
