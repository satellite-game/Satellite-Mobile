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
  this.keyboard = new s.Controls.Keyboard();

  if (hasTouch) {
    this.touch = new s.Controls.Touch();
  }
};

s.Controls.prototype.destruct = function() {
  this.game.unhook(this.update);
};

s.Controls.prototype.update = function(time, delta) {
  if (!this.ship) {
    return;
  }

  // Calculate the difference between the ideal framerate and the actual framerate
  // This is used to avoid sluggish controls on slow devices
  var frameRateFactor = (delta/1000) / (1/60);

  var root = this.ship.root;
  var body = this.ship.body;

  var pitch = 0;
  var roll = 0;
  var yaw = 0;

  var thrust = 0;

  var changeViewMode = false;
  var fire = false;
  var showBackCam = false;

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
    showBackCam = this.keyboard.showBackCam;
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
  this.ship.thrustImpulse = thrustImpulse;

  // A scalar used to control rate of turn based on thrust
  var thrustScalar = Math.abs(thrustImpulse)/s.constants.ship.forwardThrust + 1;

  // Apply speeds to values so ship behaves the same for each control type
  // Apply thrustScalar so the ship turns slower when under thrust
  // Apply frameRateFactor so control is still fast at lower framerates
  pitch = frameRateFactor * pitch * s.constants.ship.pitchSpeed / thrustScalar;
  roll = frameRateFactor * roll * s.constants.ship.rollSpeed / thrustScalar;
  yaw = frameRateFactor * yaw * s.constants.ship.yawSpeed / thrustScalar;

  // Apply values to physics simulation
  var angularVelocity = body.angularVelocity;
  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.extractRotation(root.matrix);

  // Add to the existing angular velocity,
  var newAngularVelocity = new THREE.Vector3(pitch, yaw, roll).applyMatrix4(rotationMatrix).add(angularVelocity);
  body.angularVelocity.set(newAngularVelocity.x, newAngularVelocity.y, newAngularVelocity.z);

  var forceVector = new THREE.Vector3(0, 0, thrustImpulse * this.ship.engineImpulse).applyMatrix4(rotationMatrix);
  var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
  body.applyImpulse(cannonVector, body.position);

  // Tell the player to perform actions
  if (fire) {
    // this.emit('fire');
    this.ship.fire();
  }

  if (showBackCam) {
    // @todo animate along top
    // Show cam from behind
    // this.emit('lookBack');
    this.player.setCameraViewMode('front');
  }
  else if (changeViewMode) {
    // this.emit('cycleCameraViewMode');
    this.player.cycleCameraViewMode();
  }
  else {
    // this.emit('restoreViewMode');
    this.player.restoreViewMode();
  }
};
