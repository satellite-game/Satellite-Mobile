s.Moon = new Class({
  extend: s.GameObject,

  construct: function(options) {
    // handle parameters
    this.options = options = jQuery.extend({
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(0, 0, 0, 0)
    }, options);

    var geometry = s.models.phobos_hifi.geometry;
    var materials = s.models.phobos_hifi.materials;

    // Make the moon a bit red
    materials[0].color.setHex(0x704030);

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    // Cannon.js
    var shape = new CANNON.Sphere(7250);
    var mass = 0; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    this.root.name = 'moon';
    // this.root.scale.set(2, 2, 2);
    // this.root.receiveShadow = true; // Causes shader error
  }
});
