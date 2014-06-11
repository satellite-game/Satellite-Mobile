s.BuildingShort = new Class({
  extend: s.GameObject,

  construct: function(options){
    // handle parameters
    this.options = options;

    var geometry = s.models.human_building_short.geometry;
    var materials = s.models.human_building_short.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    this.root.name = 'building_short';
  }
});
