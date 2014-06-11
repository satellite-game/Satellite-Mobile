s.SpaceStation = new Class({
  extend: s.GameObject,

  construct: function(options){
    // handle parameters
    this.options = options = jQuery.extend({
      position: new THREE.Vector3(20000, 20000, 20000),
      rotation: new THREE.Quaternion(0, 0, 0, 0)
    }, options);

    var geometry = s.models.human_space_station.geometry;
    var materials = s.models.human_space_station.materials;

    // Cannon.js
    var shape = new CANNON.Box(new CANNON.Vec3(800, 400, 500));
    var mass = 0; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    this.root.name = "spaceStation";
    this.root.team = 'alliance';
    this.root.position.copy(options.position);
    this.root.rotation.copy(options.rotation);
    // this.root.receiveShadow = true; // Causes shader error

    this.shields = s.config.base.shields;
  }
});
