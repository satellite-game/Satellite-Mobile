s.BuildingShort = new Class({
  toString: 'BuildingShort',
  extend: s.GameObject,

  construct: function(options){
    // handle parameters
    this.options = options;

    var geometry = s.models.human_building_short.geometry;
    var materials = s.models.human_building_short.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    // Cannon.js
    var shape = new CANNON.Box(new CANNON.Vec3(100, 100, 100));
    var mass = 0; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // Hitbox
    // var cube = new THREE.BoxHelper();
    // cube.material.color.setRGB(1, 0, 0);
    // cube.scale.set(100, 100, 100);
    // this.root.add(cube);
  }
});
