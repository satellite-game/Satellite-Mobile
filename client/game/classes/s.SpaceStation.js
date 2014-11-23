s.SpaceStation = function(options) {
  s.GameObject.call(this, options);

  var geometry = s.models.human_space_station.geometry;
  var materials = s.models.human_space_station.materials;

  this.root = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));

  // Cannon.js
  var shape = new CANNON.Box(new CANNON.Vec3(400, 200, 800));
  var mass = 0; // Fixed body

  this.body = new CANNON.Body({
    mass: mass
  });
  this.body.addShape(shape);

  // var cube = new THREE.BoxHelper();
  // cube.material.color.setRGB(1, 0, 0);
  // cube.scale.set(500, 220, 850);
  // this.root.add(cube);

  this.init();
};

s.SpaceStation.className = 'SpaceStation';

s.SpaceStation.prototype = Object.create(s.GameObject.prototype);
s.SpaceStation.prototype.constructor = s.SpaceStation;

s.SpaceStation.prototype.name = 'Space Station';

s.SpaceStation.prototype.explode = function() {
  var self = this;
  var defaultHP = s.SpaceStation.prototype.hp;
  var size = defaultHP;
  var totalIterations = Math.round(defaultHP / 200);
  var iterations = totalIterations;

  var makeExplosion = function() {
    var position = self.root.position.clone().add(new THREE.Vector3(Math.random()*400-200, Math.random()*200-100, Math.random()*800-400));
    new s.Explosion({
      game: self.game,
      size: size,
      position: position
    });
  };

  do {
    setTimeout(makeExplosion, iterations * 500);

    iterations--;
  }
  while (iterations > 0);

  setTimeout(function() {
    self.destructOnNextTick();
  }, totalIterations * 500);
};

s.SpaceStation.prototype.hp = 2500;

s.SpaceStation.shipSpawn = {
  position: new THREE.Vector3(34700.76873771603, -3233.650674476771, 5737.893148853195),
  rotation: new THREE.Quaternion(0.016937110115200438, 0.911158535280495, 0.4003069980380781, 0.09621624191471519) 
};
