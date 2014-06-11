s.Controls = new Class({

  toString: 'Controls',

  options: {
    rotationSpeed: Math.PI/8,
    pitchSpeed: Math.PI/32,
    yawSpeed: Math.PI/32,
    brakePower: 0.85,
    velocityFadeFactor: 16,
    rotationFadeFactor: 4,
    boundaryPushback: 0
  },

  construct: function(options) {
    // Store references to game objects
    this.HUD = options.HUD;
    this.game = options.game;
    this.player = options.player;

    // Create interpreters for controllers
    this.keyboard = new s.Keyboard();
    this.touch = new s.Touch();

    // Hook to the gameloop
    this.update = this.update.bind(this);
    this.game.hook(this.update);

    this.firing = false;

    this.lastTime = new Date().getTime();

    this.thrustImpulse = 0; 
  },

  destruct: function() {
    this.game.unhook(this.update);
  },

  update: function(time, delta) {
    var now = new Date().getTime();
    var difference = now - this.lastTime;

    var root = this.player.root;
    var body = this.player.body;

    var pitch = 0;
    var roll = 0;
    var yaw = 0;

    var thrust = 0;
    var brakes = 0;
    var thrustScalar = this.thrustImpulse/s.config.ship.maxSpeed + 1;

    ///////////////////////
    // RADIAL SUBRETICLE //
    ///////////////////////

    var yawSpeed = this.options.yawSpeed;
    var pitchSpeed = this.options.pitchSpeed;

    ///////////////////////
    // TOUCH CONTROLS  //
    ///////////////////////

    pitch = this.touch.y * this.options.pitchSpeed;
    roll = this.touch.x*-1 * this.options.rotationSpeed;
    yaw = 0;

    // @todo don't hardcode
    // var gamepadThrust = 0.5;
    // this.thrustImpulse = gamepadThrust * s.config.ship.maxSpeed;
    if (this.touch.throttle) {
        thrust = 1;
    }

    ///////////////////////
    // KEYBOARD COMMANDS //
    ///////////////////////

    if (this.keyboard.pressed('left')) {
      yaw = yawSpeed / thrustScalar;
    }
    else if (this.keyboard.pressed('right')) {
      yaw = -1*yawSpeed / thrustScalar;
    }

    if (this.keyboard.pressed('down')) {
      // Pitch down
      pitch = -1*pitchSpeed / thrustScalar;
    }
    else if (this.keyboard.pressed('up')) {
      // Pitch up
      pitch = pitchSpeed / thrustScalar;
    }

    if (this.keyboard.pressed('w')) {
      thrust = 1;
    }
    else if (this.keyboard.pressed('s')) {
      brakes = 1;
    }

    if (this.keyboard.pressed('d')) {
      roll = this.options.rotationSpeed;
    }
    else if (this.keyboard.pressed('a')) {
      roll = -1*this.options.rotationSpeed;
    }

    if (this.game.gameFire && this.keyboard.pressed('space') || this.firing){
      this.player.fire('turret');
    }

    //////////////////////////////
    // MOTION AND PHYSICS LOGIC //
    //////////////////////////////

    var linearVelocity = body.velocity;
    var angularVelocity = body.angularVelocity;
    var rotationMatrix = new THREE.Matrix4();
    rotationMatrix.extractRotation(root.matrix);

    // If ship position is greater then x apply thrust in opposite direction
    // If ship position is not greater then x allow to apply thrust
    // var playerPosition = this.player.root.position;
    // var boundryLimit = 30000;
    // If the ship is beyound the boundary limit steer it back into the map
    // if(s.util.largerThan(playerPosition, boundryLimit)){
    //   var boundryPush = new THREE.Vector3(-2*this.options.boundaryPushback*this.thrustImpulse, 0, 2*this.options.boundaryPushback*this.thrustImpulse).applyMatrix4(rotationMatrix);
    //   yaw = this.options.boundaryPushback;
    //   if (this.options.boundaryPushback < 2) this.options.boundaryPushback += 0.01;
    //   root.applyCentralImpulse(boundryPush);
    //   console.log('--Outside Boundry Limit--');
    // } else if (this.options.boundaryPushback > 0) {
    //   this.options.boundaryPushback -= 0.005;
    // }

    // Add to the existing angular velocity,
    var newAngularVelocity = new THREE.Vector3(pitch, yaw, roll).applyMatrix4(rotationMatrix).add(angularVelocity);
    body.angularVelocity.set(newAngularVelocity.x, newAngularVelocity.y, newAngularVelocity.z);

    // Apply thrust
    // Invert existing linear velocity
    // Fractionally apply the opposite impulse
    // Then apply forward impulse
    // if (thrust && this.thrustImpulse < s.config.ship.maxSpeed){
    //   this.thrustImpulse += (difference > s.config.ship.maxSpeed) ? s.config.ship.maxSpeed : difference;
    // }

    // if (brakes && this.thrustImpulse > 0){
    //   this.thrustImpulse -= difference;
    // }

    if (thrust) {
        this.thrustImpulse = s.config.ship.maxSpeed;
    }
    else {
        this.thrustImpulse = 0;
    }

    var forceVector = new THREE.Vector3(0, 0, this.thrustImpulse).applyMatrix4(rotationMatrix);
    var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
    body.applyImpulse(cannonVector, body.position);
    // body.applyForce(forceVector, new CANNON.Vec3(0,0,0));
    this.lastTime = now;
  }
});
