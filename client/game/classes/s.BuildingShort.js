s.BuildingShort = new Class({
  extend: s.GameObject,

  construct: function(options){
    // handle parameters
    this.options = options = jQuery.extend({
      position: options.position,
      rotation: options.rotation
    }, options);

    var geometry = s.models.human_building_short.geometry;
    var materials = s.models.human_building_short.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    this.root.name = "building_short";
    this.root.position.copy(options.position);
    this.root.rotation.copy(options.rotation);
    // this.root.receiveShadow = true; // Causes shader error
  }
});
