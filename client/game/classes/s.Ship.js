s.Ship = new Class({
  extend: s.GameObject,

  options: {  
  },

  initialize: function(options) {
    var geometry = s.models[options.shipClass].geometry;
    this.materials = s.models[options.shipClass].materials[0];
    this.materials.emissive = new THREE.Color('rgb(255,255,255)');

    this.root = new THREE.Mesh(geometry, this.materials);
    this.root.position.copy(options.position);
    this.root.rotation.copy(options.rotation);

    this.lastTurretFire = 0;
    this.lastMissileFire = 0;
    this.alliance = options.alliance;

    this.root.name = this.name;
    this.hull = s.config.ship.hull;
    this.shields = s.config.ship.shields;

    this.lastTime = new Date().getTime();
    this.alternateFire = false;
  }
});
