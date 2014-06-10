s.MoonBaseTall = new Class({
  extend: s.GameObject,

  construct: function(options){
    // handle parameters
    this.options = options = jQuery.extend({
      position: new THREE.Vector3(-6516.61181640625, 334.5599060058594, -99.58238220214844),
      rotation: new THREE.Vector3(0,Math.PI/8,Math.PI/2)
    }, options);

    var geometry = s.models.human_building_tall.geometry;
    var materials = s.models.human_building_tall.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    this.root.name = "moonBaseTall";
    this.root.team = 'rebel';

    this.root.position.copy(options.position);
    this.root.rotation.copy(options.rotation);

    // this.root.receiveShadow = true; // Causes shader error

    this.shields = s.config.base.shields;
  }
});
