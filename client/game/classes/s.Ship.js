s.Ship = new Class({
  extend: s.GameObject,

  construct: function(options) {
    var geometry = s.models[options.shipClass].geometry;
    this.materials = s.models[options.shipClass].materials[0];
    this.materials.emissive = new THREE.Color('rgb(255,255,255)');

    this.root = new THREE.Mesh(geometry, this.materials);
    this.root.castShadow = true;

    // Cannon.js
    var shape = new CANNON.Sphere(100);
    var mass = 1;
    var body = this.body = new CANNON.RigidBody(mass, shape);

    // Slow down/bleed off rolling
    body.angularDamping = 0.99;
    body.linearDamping = 0.5;

    this.lastTurretFire = 0;
    this.lastMissileFire = 0;
    this.team = options.team;

    this.hull = s.config.ship.hull;
    this.shields = s.config.ship.shields;

    this.lastTime = new Date().getTime();
    this.alternateFire = false;

    // Engine glow
    this.flames = [];
    this.flameMultiplier = [2, 3, 2, 1, 0.75];
    for (var i = this.flameMultiplier.length - 1; i >= 0; i--) {
      var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: s.textures.particle,
        useScreenCoordinates: false,
        blending: THREE.AdditiveBlending,
        color: 0x00FFFF
      }));

      this.flames.push(sprite);
      this.root.add(sprite);
      sprite.position.set(0, 0, (i+1) * 10 - 100);
    }

    this.trailGlow = new THREE.PointLight(0x002525, 1, 250);
    this.root.add(this.trailGlow);
    this.trailGlow.position.set(0, 0, 35);
  },

  update: function() {
    this._super.apply(this, arguments);

    // Adjusts engine glow based on linear velocity
    this.trailGlow.intensity = this.game.controls.thrustImpulse / 5;

    var flameScaler = (Math.random()*0.1 + 1);
    this.flames[0].scale.set(this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler);
    this.flames[1].scale.set(this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler);
    this.flames[2].scale.set(this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler);
    this.flames[3].scale.set(this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler);
    this.flames[4].scale.set(this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler);
  },

  lookAt: function(worldPosVec3) {
    // Make the mesh point at the position
    this.root.lookAt(worldPosVec3);

    // Use the mesh's quaternion to set the rotation of the body in the physics simulation
    var q = this.root.quaternion;
    this.body.quaternion.set(q.x, q.y, q.z, q.w);
  }
});
