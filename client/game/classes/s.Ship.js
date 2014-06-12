s.Ship = new Class({
  toString: 'Ship',
  extend: s.GameObject,

  construct: function(options) {
    this.lastThrustTime = 0;
    this.lastRetroThrustTime = 0;
    this.lastFireTime = 0;

    var geometry = s.models[options.shipClass].geometry;
    this.materials = s.models[options.shipClass].materials[0];

    // Be very lit up by default
    this.materials.emissive = new THREE.Color(0x111111);

    this.root = new THREE.Mesh(geometry, this.materials);
    this.root.castShadow = true;

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
    var mass = 1; // Fixed body
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // var cube = new THREE.BoxHelper();
    // cube.material.color.setRGB(1, 0, 0);
    // cube.scale.set(50, 20, 50);
    // this.root.add(cube);

    // Slow down/bleed off rolling
    body.angularDamping = 0.99;
    body.linearDamping = 0.5;

    this.engineGlowMaterial = new THREE.SpriteMaterial({
      map: s.textures.particle,
      blending: THREE.AdditiveBlending,
      color: 0x335577
    })

    this.gunGlowMaterial = new THREE.SpriteMaterial({
      map: s.textures.particle,
      blending: THREE.AdditiveBlending,
      color: 0x1A8CFF
    })

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
  },

  fire: function() {
    // Just store the time for lighting effects
    this.lastFireTime = s.game.now;
  },

  update: function(now, delta) {
    var self = this;
    this._super.apply(this, arguments);

    // Adjusts engine glow based on linear velocity
    var thrustScalar = Math.abs(this.game.controls.thrustImpulse) / this.game.controls.options.forwardThrust;

    var lightMin = 0.5;
    var lightScalar = 4;
    var glowScalar = 15
    var flameDanceScaler = (Math.random()*0.1 + 1);

    // Calculate time since events happened to determine fade
    var timeSinceLastThrust = s.game.now - this.lastThrustTime;
    var timeSinceLastRetroThrust = s.game.now - this.lastRetroThrustTime;
    var timeSinceLastFire = now - this.lastFireTime;

    if (this.game.controls.thrustImpulse < 0) {
      this.lastRetroThrustTime = now;
    }

    if (this.game.controls.thrustImpulse > 0) {
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
      gunLightFadeScale = 1 - timeSinceLastRetroThrust / s.Ship.fireInterval
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
  }
});

s.Ship.engineFadeTime = 3000;
s.Ship.fireInterval = 125;
