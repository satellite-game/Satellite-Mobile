s.SpaceStation = new Class({
  toString: 'SpaceStation',
  extend: s.GameObject,

  properties: {
    hp: {
      default: 200//2500
    }
  },

  construct: function(options){
    this.options = options = jQuery.extend({
      position: new THREE.Vector3(20000, 20000, 20000),
      rotation: new THREE.Quaternion(0, 0, 0, 0)
    }, options);

    var geometry = s.models.human_space_station.geometry;
    var materials = s.models.human_space_station.materials;

    // Cannon.js
    var shape = new CANNON.Box(new CANNON.Vec3(400, 200, 800));
    var mass = 0; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
  }
});
