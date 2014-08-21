s.GameObject = function(options) {
  s.EventEmitter.call(this);

  if (options.rotation) {
    if (!(options.rotation instanceof THREE.Quaternion)) {
      throw new Error('s.GameObject: options.rotation should be a THREE.Quaternion');
    }
  }

  // Bind execution scope if necessary
  if (this.handleCollision) {
    this.handleCollision = this.handleCollision.bind(this);
  }

  if (this.update) {
    this.update = this.update.bind(this);
  }

  // Store scene for remove
  this.game = options.game;

  // Store team name
  this.team = options.team;

  // Store options
  this.options = options;

  // Flag to destruct on next tick
  this.isDestroyed = false;

  // Flag to initialize on next tick
  this.initialized = false;

  // Initialize after call stack clears
  setTimeout(this.init.bind(this), 0);
};

s.GameObject.prototype = Object.create(s.EventEmitter.prototype);

s.GameObject.prototype.toString = function() { return this.name; };

// Default HP
s.GameObject.prototype.hp = 100;

// @perf: Setters/getters are still an order of magnitude slower on iOS 8
// http://jsperf.com/es5-getters-setters-versus-getter-setter-methods/12
// Use methods for setting hp/visible
s.GameObject.prototype.show = function(visible) {
  this.root.visible = true;
};

s.GameObject.prototype.hide = function() {
  this.root.visible = false;
};

s.GameObject.prototype.isVisible = function() {
  return this.root.visible;
};

s.GameObject.prototype.takeHit = function(amount) {
  this.hp -= amount;

  if (this.hp <= 0) {
    this.explode();
  }
};

// Die on next update
// If destruct() is executed immediately, Cannon.js throws
s.GameObject.prototype.destructOnNextTick = function() {
  this.isDestroyed = true;
};

s.GameObject.prototype.explode = function() {
  var self = this;
  var defaultHP = this.constructor.prototype.hp;
  var size = defaultHP * 5;

  var position = this.root.position.clone().add(new THREE.Vector3(Math.random()*20-10, Math.random()*20-10, Math.random()*20-10));
  new s.Explosion({
    game: this.game,
    size: size,
    position: position
  });

  setTimeout(function() {
    self.destructOnNextTick();
  }, 500);
};

s.GameObject.prototype.init = function() {
  this.team = this.options.team || 'unaffiliated';

  if (this.root) {
    // Position mesh in scene
    if (this.options.position) {
      this.root.position.copy(this.options.position);
    }
    if (this.options.rotation) {
      this.root.quaternion.copy(this.options.rotation);
    }

    this.root.name = this.toString();
  }

  if (this.body) {
    // Store a reference to the instance on the object
    // This is used after a collision is detected
    // For instance, to remove HP from the item hit
    this.body.instance = this;

    // Position body in physics simulation
    // Manually assign values so both CANNON and THREE math types are supported
    if (this.options.position) {
      this.body.position.set(this.options.position.x, this.options.position.y, this.options.position.z);
    }
    if (this.options.rotation) {
      this.body.quaternion.set(this.options.rotation.x, this.options.rotation.y, this.options.rotation.z, this.options.rotation.w);
    }
    if (this.options.velocity) {
      this.body.velocity.set(this.options.velocity.x, this.options.velocity.y, this.options.velocity.z);
    }
    if (this.options.angularVelocity) {
      this.body.angularVelocity.set(this.options.angularVelocity.x, this.options.angularVelocity.y, this.options.angularVelocity.z);
    }

    // @todo: do we need to remove this listener when destructed?
    this.body.addEventListener('collide', this.handleCollision.bind(this));
  }

  this.add();
};

s.GameObject.prototype.handleCollision = function(event) {
  var target = event['with'];
  if (target.instance && target.instance.damage) {
    this.takeHit(target.instance.damage);
  }
};

s.GameObject.prototype.destruct = function() {
  // Unhook from the rendering loop
  if (this.update) {
    this.game.unhook(this.update);
  }

  // Remove from physics simulation
  if (this.body) {
    this.game.world.remove(this.body);
  }

  // Remove from the scene
  if (this.root) {
    this.game.scene.remove(this.root);
  }
};

s.GameObject.prototype.add = function() {
  // Add mesh to world
  if (this.root) {
    this.game.scene.add(this.root);
  }

  if (this.body) {
    this.game.world.add(this.body);
  }

  // Hook to the rendering loop
  if (this.update && !this.hooked) {
    this.game.hook(this.update);
    this.hooked = true;
  }

  return this;
};

s.GameObject.prototype.update = function() {
  if (this.isDestroyed) {
    this.destruct();
  }
  else {
    if (this.body) {
      // Copy coordinates from Cannon.js to Three.js
      this.body.position.copy(this.root.position);
      this.body.quaternion.copy(this.root.quaternion);
    }
  }
};

/**
  Set the state of this object given a packet from the server

  state - An object representing the game object's state
  state.pos - Position vector3 represented as [x, y, z]
  state.rot - Rotation quaternion represented as [x, y, z, w]
  state.lv - Linear velocity vector3 represented as [x, y, z]
  state.av - Angular velocity vector3 represented as [x, y, z]
*/
s.GameObject.prototype.setStateFromPacket = function(state) {
  var pos = state.pos;
  var rot = state.rot;
  var av = state.av;
  var lv = state.lv;

  if (pos) {
    this.root.position.set(pos[0], pos[1], pos[2]);
  }
  if (rot) {
    this.root.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
  }

  if (this.body) {
    if (pos) {
      this.body.position.set(pos[0], pos[1], pos[2]);
    }

    if (rot) {
      this.body.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
    }

    if (lv) {
      this.body.velocity.set(lv[0], lv[1], lv[2]);
    }
    if (av) {
      this.body.angularVelocity.set(av[0], av[1], av[2]);
    }
  }
};

s.GameObject.prototype.lookAt = function(worldPosVec3) {
  // Make the mesh point at the position
  this.root.lookAt(worldPosVec3);
  if (this.body) {
    // Use the mesh's quaternion to set the rotation of the body in the physics simulation
    var q = this.root.quaternion;
    this.body.quaternion.set(q.x, q.y, q.z, q.w);
  }
};
