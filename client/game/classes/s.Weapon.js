s.Weapon = function(options) {
  s.GameObject.call(this, options);

  // Destory projectile after 4 secs
  this._flightTimeout = setTimeout(this.destruct.bind(this), this.flightTime);
};

s.Weapon.prototype = Object.create(s.GameObject.prototype);

s.Weapon.prototype.destruct = function() {
  clearTimeout(this._flightTimeout);

  s.GameObject.prototype.destruct.call(this);
};

s.Weapon.prototype.init = function() {
  s.GameObject.prototype.init.call(this);

  // Make sure the matrix is up to date before we try to use it
  this.root.updateMatrix();

  var body = this.body;
  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.extractRotation(this.root.matrix);

  // Apply impulse
  var forceVector = new THREE.Vector3(0, 0, this.velocity).applyMatrix4(rotationMatrix);
  var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
  body.applyImpulse(cannonVector, body.position);
};

s.Weapon.prototype.damage = 10;
s.Weapon.prototype.flightTime = 4000;
