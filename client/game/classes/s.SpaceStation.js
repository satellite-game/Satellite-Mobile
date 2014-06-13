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
      position: new THREE.Vector3(),
      rotation: new THREE.Quaternion()
    }, options);

    var geometry = s.models.human_space_station.geometry;
    var materials = s.models.human_space_station.materials;

    this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

    // Cannon.js
    var shape = new CANNON.Box(new CANNON.Vec3(400, 200, 800));
    var mass = 0; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // var cube = new THREE.BoxHelper();
    // cube.material.color.setRGB(1, 0, 0);
    // cube.scale.set(500, 220, 850);
    // this.root.add(cube);
  },

  explode: function() {
    var self = this;
    var defaultHP = this.constructor.properties.hp.default;
    var size = defaultHP * 5;
    var totalIterations = Math.round(defaultHP / 100);
    var iterations = totalIterations;
    do {
      setTimeout(function() {
        var position = self.root.position.clone().add(new THREE.Vector3(Math.random()*400-200, Math.random()*200-100, Math.random()*800-400))
        new s.Explosion({
          game: self.game,
          size: size,
          position: position
        });
      }, iterations * 500);

      iterations--;
    }
    while (iterations > 0);

    setTimeout(function() {
      self.destructOnNextTick();
    }, totalIterations * 500);
  }
});
