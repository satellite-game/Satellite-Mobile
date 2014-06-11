s.BuildingTall = new Class({
  extend: s.GameObject,

  construct: function(options) {
    // handle parameters
    this.options = options = jQuery.extend({
      position: new THREE.Vector3(-6516.61181640625, 334.5599060058594, -99.58238220214844),
      rotation: new THREE.Quaternion()
    }, options);

    var geometry = s.models.human_building_tall.geometry;
    var materials = s.models.human_building_tall.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    this.root.name = 'building_tall';
  }
});
