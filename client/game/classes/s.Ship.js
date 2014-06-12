s.Ship = new Class({
  toString: 'Ship',
  extend: s.GameObject,

  construct: function(options) {
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

    this.forwardGlowMaterial = new THREE.SpriteMaterial({
      map: s.textures.particle,
      useScreenCoordinates: false,
      blending: THREE.AdditiveBlending,
      color: 0x335577
    })
    this.backwardGlowMaterial = new THREE.SpriteMaterial({
      map: s.textures.particle,
      useScreenCoordinates: false,
      blending: THREE.AdditiveBlending,
      color: 0x115599
    })

    // Engine glow
    this.flames = [];
    this.baseFlamePosition = -40;
    this.flamePositions = [22, 19, 13, 7, 0];
    this.flameMultiplier = [0.5, 0.75, 1.25, 2.25, 3.25, 2];
    this.flameMultiplierBackwards = [1, 2, 3, 1, 2, 3];
    for (var i = 0; i < this.flameMultiplier.length; i++) {
      var flame = new THREE.Sprite();

      this.flames.push(flame);
      this.root.add(flame);
    }

    // Color and intensity are calculated according to thrust impulse
    // Changing these here will do nothing
    this.trailGlow = new THREE.PointLight(0xFFFFFF, 1, 250);
    this.trailGlow.position.set(0, 5, -50);
    this.root.add(this.trailGlow);

    // Vectors for gun offsets
    var xOff = 29;
    var yOff = -4.5;
    var zOff = 19;
    this.offsetGunLeft = new THREE.Vector3(xOff, -yOff, zOff);
    this.offsetGunRight = new THREE.Vector3(-xOff, -yOff, zOff);
    this.offsetBullet = new THREE.Vector3(0, 0, 100);
  },

  update: function() {
    var self = this;
    this._super.apply(this, arguments);

    // Adjusts engine glow based on linear velocity
    this.trailGlow.intensity = Math.abs(this.game.controls.thrustImpulse) / 8;
    var intensity = Math.abs(this.game.controls.thrustImpulse) / 2;

    var material;
    var flameMultiplier;
    if (this.game.controls.thrustImpulse < 0) {
      material = this.backwardGlowMaterial;
      flameMultiplier = this.flameMultiplierBackwards;

      this.trailGlow.position.set(0, 6, 20);
      this.flames.forEach(function(flame, index) {
        if (index < 3) {
          flame.position.copy(self.offsetGunLeft);
        }
        else {
          flame.position.copy(self.offsetGunRight);
        }
      });
    }
    else {
      flameMultiplier = this.flameMultiplier;
      material = this.forwardGlowMaterial;

      this.trailGlow.position.set(0, 5, -50);
      this.flames.forEach(function(flame, i) {
        // Use a random Y value to make it shimmer
        flame.position.set(0, Math.random(), self.baseFlamePosition - self.flamePositions[i]);
      });
    }

    // Set the glow color
    this.trailGlow.color.set(material.color);

    // Set random intensity variation
    var flameScaler = (Math.random()*0.1 + 1);

    // Set intensity and color
    this.flames.forEach(function(flame, index) {
      flame.scale.set(flameMultiplier[index]*intensity*flameScaler, flameMultiplier[index]*intensity*flameScaler, flameMultiplier[index]*intensity*flameScaler);
      flame.material = material;
    });
  }
});
