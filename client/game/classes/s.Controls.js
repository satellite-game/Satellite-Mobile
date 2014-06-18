s.Controls = function(options) {
  // Store references to game objects
  this.game = options.game;
  this.player = options.player;

  // Hook to the gameloop
  this.update = this.update.bind(this);
  this.game.hook(this.update);

  // Choose control method
  var hasTouch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
  this.controlMethod = hasTouch ? 'touch' : 'keyboard';

  // Create interpreters for controllers
  this.touch = new s.Controls.Touch();
  this.keyboard = new s.Controls.Keyboard();
};

s.Controls.prototype.destruct = function() {
  this.game.unhook(this.update);
};

s.Controls.prototype.update = function(time, delta) {
  var now = new Date().getTime();

  var root = this.player.root;
  var body = this.player.body;

  var pitch = 0;
  var roll = 0;
  var yaw = 0;

  var thrust = 0;

  var changeViewMode = false;
  var fire = false;

  // Control method
  if (this.controlMethod === 'touch') {
    pitch = this.touch.pitch;
    roll = this.touch.roll;
    yaw = this.touch.yaw;
    thrust = this.touch.thrust;
    fire = this.touch.fire;
    changeViewMode = this.touch.changeViewMode;
  }
  else if (this.controlMethod === 'keyboard') {
    // Update keyboard before polling
    this.keyboard.update();

    pitch = this.keyboard.pitch;
    roll = this.keyboard.roll;
    yaw = this.keyboard.yaw;
    thrust = this.keyboard.thrust;
    fire = this.keyboard.fire;
    changeViewMode = this.keyboard.changeViewMode;
  }

  // Calculate thrust impulse based on direction
  var thrustImpulse = 0;
  if (thrust > 0) {
    thrustImpulse = thrust * s.constants.ship.forwardThrust;
  }
  else if (thrust < 0) {
    thrustImpulse = thrust * s.constants.ship.backwardThrust;
  }

  // Expose thrust impulse for visuals
  this.thrustImpulse = thrustImpulse;

  // A scalar used to control rate of turn based on thrust
  var thrustScalar = Math.abs(thrustImpulse)/s.constants.ship.forwardThrust + 1;

  // Apply speeds to values so ship behaves the same for each control type
  // Apply thrustScalar so the ship turns slower when under thrust
  pitch = pitch * s.constants.ship.pitchSpeed / thrustScalar;
  roll = roll * s.constants.ship.rollSpeed / thrustScalar;
  yaw = yaw * s.constants.ship.yawSpeed / thrustScalar;

  // Apply values to physics simulation
  var angularVelocity = body.angularVelocity;
  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.extractRotation(root.matrix);

  // Add to the existing angular velocity,
  var newAngularVelocity = new THREE.Vector3(pitch, yaw, roll).applyMatrix4(rotationMatrix).add(angularVelocity);
  body.angularVelocity.set(newAngularVelocity.x, newAngularVelocity.y, newAngularVelocity.z);

  var forceVector = new THREE.Vector3(0, 0, thrustImpulse).applyMatrix4(rotationMatrix);
  var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
  body.applyImpulse(cannonVector, body.position);

  // Tell the player to perform actions
  if (fire) {
    this.player.fire();
  }

  if (changeViewMode) {
    this.player.cycleCameraViewMode();
  }
};
