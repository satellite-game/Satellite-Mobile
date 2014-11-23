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

  // Store id
  this.id = options.id;

  // Store options
  this.options = options;

  this.destructOnExplode = !!options.destructOnExplode;

  // Use passed HP or default
  this.hp = typeof options.hp !== 'undefined' ? options.hp : this.hp;

  // State packet
  // We'll re-use this object and its arrays to avoid constant object allocation/deallocation
  this.state = {
    pos: [0, 0, 0],     // Position vector
    rot: [0, 0, 0, 0],  // Rotation quaternion
    va: [0, 0, 0],      // Angular velocity vector
    vl: [0, 0, 0]       // Linear velocity vector
  };

  // Flag to destruct on next tick
  this.isDestroyed = false;
};

s.GameObject.prototype = Object.create(s.EventEmitter.prototype);
s.GameObject.prototype.constructor = s.GameObject;

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

  // Dissapear after a delay
  // if (this.destructOnExplode !== false) {
  //   setTimeout(function() {
  //     self.destructOnNextTick();
  //   }, 500);
  // }

  // Dissapear immediately
  this.destruct();
};

s.GameObject.prototype.init = function() {
  // Set team to unaffiliated if not provided or set by other constructors
  this.team = this.options.team || 'unaffiliated';

  if (this.root) {
    // Position mesh in scene
    if (this.options.position) {
      this.root.position.copy(this.options.position);
    }
    if (this.options.rotation) {
      this.root.quaternion.copy(this.options.rotation);
    }

    // Store team and name on object itself
    this.root.name = this.toString();
    this.root.team = this.team;
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

    if (this.handleCollision) {
      // @todo: do we need to remove this listener when destructed?
      this.body.addEventListener('collide', this.handleCollision.bind(this));
    }
  }

  this.add();
};

// s.GameObject.prototype.handleCollision = function(event) {
//   var target = event['with'];
//   if (target.instance && target.instance.damage) {
//     this.takeHit(target.instance.damage);
//   }
// };

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
      this.root.position.copy(this.body.position);

      // Cannot use THREE.Quaternion#copy() as it expected _ prefixed vars
      this.root.quaternion.x = this.body.quaternion.x;
      this.root.quaternion.y = this.body.quaternion.y;
      this.root.quaternion.z = this.body.quaternion.z;
      this.root.quaternion.w = this.body.quaternion.w;
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

/**
  Set the state of this object given a packet from the server

  state - An object representing the game object's state
  state.pos - Position vector3
  state.rot - Rotation quaternion represented as [x, y, z, w]
  state.lv - Linear velocity vector3
  state.av - Angular velocity vector3
*/
s.GameObject.prototype.setState = function(pos, rot, av, lv) {
  if (pos) {
    this.root.position.copy(pos);
  }
  if (rot) {
    this.root.quaternion.copy(rot);
  }

  if (this.body) {
    if (pos) {
      this.body.position.set(pos.x, pos.y, pos.z);
    }

    if (rot) {
      this.body.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }

    if (lv) {
      this.body.velocity.set(lv.x, lv.y, lv.z);
    }
    if (av) {
      this.body.angularVelocity.set(av.x, av.y, av.z);
    }
  }
};

s.GameObject.prototype.getStatePacket = function() {
  var pos = this.root.position;
  var rot = this.root.quaternion;
  var va = this.body.angularVelocity;
  var vl = this.body.velocity;

  this.state.pos[0] = pos.x;
  this.state.pos[1] = pos.y;
  this.state.pos[2] = pos.z;

  this.state.rot[0] = rot.x;
  this.state.rot[1] = rot.y;
  this.state.rot[2] = rot.z;
  this.state.rot[3] = rot.w;

  this.state.vl[0] = vl.x;
  this.state.vl[1] = vl.y;
  this.state.vl[2] = vl.z;

  this.state.va[0] = va.x;
  this.state.va[1] = va.y;
  this.state.va[2] = va.z;

  return this.state;
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
