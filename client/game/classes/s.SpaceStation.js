s.SpaceStation = function(options) {
  s.GameObject.call(this, options);

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
};

s.SpaceStation.prototype = Object.create(s.GameObject.prototype);

s.SpaceStation.prototype.explode = function() {
  var self = this;
  var defaultHP = s.SpaceStation.prototype.hp;
  var size = defaultHP;
  var totalIterations = Math.round(defaultHP / 200);
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
};

s.SpaceStation.prototype.hp = 2500;

s.SpaceStation.shipSpawn = {
  position: new THREE.Vector3(19562.491512697547, 19618.948414021877, 19988.645332582022),
  rotation: new THREE.Quaternion(-0.17750835538730667, 0.8755285517609332, -0.23197996825512426, -0.38487119033184075) 
};
