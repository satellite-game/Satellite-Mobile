s.Ship = function(options) {
  s.GameObject.call(this, options);

  this.lastThrustTime = 0;
  this.lastRetroThrustTime = 0;
  this.lastFireTime = 0;
  this.thrustImpulse = 0;
  this.shipClass = options.shipClass;

  // Don't go away when we blow up
  this.options.destructOnExplode = false;

  var geometry = s.models[this.team+'_ship_'+this.shipClass].geometry;
  this.materials = s.models[this.team+'_ship_'+this.shipClass].materials[0];

  // Be very lit up by default
  this.materials.emissive = new THREE.Color(0x111111);

  this.root = new THREE.Mesh(geometry, this.materials);

  // Cast a shadow
  if (s.config.shadows) {
    this.root.castShadow = true;
  }

  // Shield hit box
  // var shape = new CANNON.Sphere(40);
  // var mass = 0;
  // var body = this.body = new CANNON.RigidBody(mass, shape);
  // var sphere = new THREE.Mesh(new THREE.SphereGeometry(40), new THREE.MeshBasicMaterial({
  //   wireframe: true,
  //   color: 'red'
  // }));
  // this.root.add(sphere);

  // Ship hitbox
  // var shipShape = new CANNON.Box(new CANNON.Vec3(40, 10, 40)); // Tight
  var shape = new CANNON.Box(new CANNON.Vec3(50, 20, 50)); // Loose
  var mass = this.mass; // Fixed body
  var body = this.body = new CANNON.RigidBody(mass, shape);

  // var cube = new THREE.BoxHelper();
  // cube.material.color.setRGB(1, 0, 0);
  // cube.scale.set(50, 20, 50);
  // this.root.add(cube);

  // Slow down/bleed off rolling
  body.angularDamping = s.constants.ship.angularDamping;
  body.linearDamping = s.constants.ship.linearDamping;

  this.engineGlowMaterial = new THREE.SpriteMaterial({
    map: s.textures.particle,
    blending: THREE.AdditiveBlending,
    color: s.Ship.engineGlowColors[this.team]
  });

  this.gunGlowMaterial = new THREE.SpriteMaterial({
    map: s.textures.particle,
    blending: THREE.AdditiveBlending,
    color: s.Ship.gunGlowColors[this.team]
  });

  // Vectors for gun offsets
  var xOff = 29.30;
  var yOff = -3.85;
  var zOff = 18.5;
  this.offsetGunLeft = new THREE.Vector3(xOff, -yOff, zOff);
  this.offsetGunRight = new THREE.Vector3(-xOff, -yOff, zOff);
  this.offsetBullet = new THREE.Vector3(0, 0, 100);

  // Engine glow
  this.engineFlames = [];
  this.baseFlamePosition = -42;
  this.flamePositions = [30, 25, 20, 14, 8, 0];
  this.flameMultiplier = [0.5, 0.75, 1.25, 2.25, 3.25, 2];
  for (var i = 0; i < this.flameMultiplier.length; i++) {
    var flame = new THREE.Sprite(this.engineGlowMaterial);
    this.engineFlames.push(flame);
    this.root.add(flame);
  }

  // Flares on each gun tip
  this.leftGunFlare = new THREE.Sprite(this.gunGlowMaterial);
  this.leftGunFlare.scale.set(0, 0, 0);
  this.leftGunFlare.position.copy(this.offsetGunLeft);
  this.root.add(this.leftGunFlare);

  this.rightGunFlare = new THREE.Sprite(this.gunGlowMaterial);
  this.rightGunFlare.scale.set(0, 0, 0);
  this.rightGunFlare.position.copy(this.offsetGunRight);
  this.root.add(this.rightGunFlare);

  // @todo these lights don't show up on other players since we can't add lights dynamically!
  // @todo we need a pool of lights to use on nearby ships

  // Intensity is dynamic
  // Changing it here will do nothing
  this.engineGlow = new THREE.PointLight(this.engineGlowMaterial.color, 1, 250);
  this.engineGlow.position.set(0, 5, -50);
  this.root.add(this.engineGlow);

  // Intensity is dynamic
  // Changing it here will do nothing
  this.gunGlow = new THREE.PointLight(this.gunGlowMaterial.color, 1, 250);
  this.gunGlow.position.set(0, 6, 20);
  this.root.add(this.gunGlow);
};

s.Ship.gunGlowColors = {
  human: 0x1A8CFF,
  alien: 0xAA0A00
};

s.Ship.engineGlowColors = {
  human: 0x335577,
  alien: 0x440D00
};

s.Ship.engineFadeTime = 3000;
s.Ship.fireInterval = 125;

s.Ship.prototype = Object.create(s.GameObject.prototype);

s.Ship.prototype.mass = 100;
s.Ship.prototype.engineImpulse = 100;

s.Ship.prototype.name = 'Ship';

s.Ship.prototype.spawnBullets = function(packet) {
  new s.Weapon.Plasma({
    game: s.game,
    velocity: packet.vl,
    position: packet.pos[0],
    rotation: packet.rot,
    team: this.team
    // @todo player object?
  });

  new s.Weapon.Plasma({
    game: s.game,
    velocity: packet.vl,
    position: packet.pos[1],
    rotation: packet.rot,
    team: this.team
    // @todo player object?
  });

  s.Weapon.Plasma.sound.play(packet.pos[0]);
};

s.Ship.prototype.fire = function(packet) {
  var now = s.game.now;
  if (now - this.lastFireTime > s.Ship.fireInterval) {
    this.root.updateMatrixWorld();

    var leftPos = this.offsetGunLeft.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld);
    var rightPos = this.offsetGunRight.clone().add(this.offsetBullet).applyMatrix4(this.root.matrixWorld);

    var packet = {
      vl: this.body.velocity,
      pos: [leftPos, rightPos],
      rot: this.root.quaternion,
      weapon: 'plasma' // @todo don't hardcode
    };

    this.spawnBullets(packet);

    this.trigger('fire', packet);

    this.lastFireTime = s.game.now;
  }
};

s.Ship.prototype.update = function(now, delta) {
  s.GameObject.prototype.update.apply(this, arguments);

  var self = this;

  // Adjusts engine glow based on thrust impulse
  var thrustScalar = Math.abs(this.thrustImpulse) / s.constants.ship.forwardThrust;

  var lightMin = 0.5;
  var lightScalar = 4;
  var glowScalar = 15;
  var flameDanceScaler = (Math.random()*0.1 + 1);

  // Calculate time since events happened to determine fade
  var timeSinceLastThrust = s.game.now - this.lastThrustTime;
  var timeSinceLastRetroThrust = s.game.now - this.lastRetroThrustTime;
  var timeSinceLastFire = now - this.lastFireTime;

  if (this.thrustImpulse < 0) {
    this.lastRetroThrustTime = now;
  }

  if (this.thrustImpulse > 0) {
    var lightIntensity = thrustScalar * lightScalar;
    var glowIntensity = thrustScalar * glowScalar;

    // Light in the back
    this.engineGlow.intensity = lightIntensity;

    this.engineGlow.color.set(this.engineGlowMaterial.color);

    // Set random intensity variation
    var flameMultiplier = this.flameMultiplier;
    this.engineFlames.forEach(function(flame, i) {
      // Use a random Y value to make it shimmer
      flame.position.set(Math.random() - 0.5, Math.random() - 0.5, self.baseFlamePosition - self.flamePositions[i]);
      flame.scale.set(flameMultiplier[i]*glowIntensity*flameDanceScaler, flameMultiplier[i]*glowIntensity*flameDanceScaler, flameMultiplier[i]*glowIntensity*flameDanceScaler);
    });

    this.lastThrustTime = now;
  }
  else if (timeSinceLastThrust < s.Ship.engineFadeTime) {
    // Fade out engine flames
    var fadeScale = 1 - (now - this.lastThrustTime)/s.Ship.engineFadeTime;

    this.engineFlames.forEach(function(flame, i) {
      flame.scale.multiplyScalar(fadeScale, fadeScale, fadeScale);
    });

    this.engineGlow.intensity *= fadeScale;
    this.engineGlow.intensity = Math.max(this.engineGlow.intensity, lightMin);
  }

  // Fade out gun lights
  var showGunLights = false;
  var gunLightFadeScale = 0;

  if (timeSinceLastFire <= s.Ship.fireInterval) {
    showGunLights = true;
    gunLightFadeScale = 1 - timeSinceLastFire / s.Ship.fireInterval;
  }
  else if (timeSinceLastRetroThrust < s.Ship.fireInterval) {
    showGunLights = true;
    gunLightFadeScale = 1 - timeSinceLastRetroThrust / s.Ship.fireInterval;
  }

  if (showGunLights) {
    // Light in the front
    this.gunGlow.intensity = gunLightFadeScale * lightScalar;

    // Fade out so guns are not lit up before next fire
    this.leftGunFlare.scale.set(glowScalar*gunLightFadeScale*flameDanceScaler, glowScalar*gunLightFadeScale*flameDanceScaler, glowScalar*gunLightFadeScale*flameDanceScaler);
    this.rightGunFlare.scale.set(glowScalar*gunLightFadeScale*flameDanceScaler, glowScalar*gunLightFadeScale*flameDanceScaler, glowScalar*gunLightFadeScale*flameDanceScaler);
  }
  else {
    // Hide them
    this.leftGunFlare.scale.set(0, 0, 0);
    this.rightGunFlare.scale.set(0, 0, 0);
  }
};

s.Ship.prototype.explode = function() {
  s.GameObject.prototype.explode.apply(this, arguments);

  this.hp = 100;
};
