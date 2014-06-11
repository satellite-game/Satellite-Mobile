s.SatelliteGame = new Class({
  toString: 'SatelliteGame',
  extend: s.Game,

  // Models that should be loaded
  models: [
    'phobos_hifi',
    'human_ship_heavy',
    'human_ship_light',
    'human_space_station',
    'human_building_short',
    'human_building_tall'
  ],

  textures: [
    'particle.png',
    'explosion.png',
    'crosshairs.png'
  ],

  initialize: function() {
    // Create sound object
    this.sound = new s.Sound({
        enabled: s.config.sound.enabled,
        sounds: s.config.sound.sounds
    });

    // this.startingPosition = this.getStartPosition();
    // Start looking at the space station
    this.startingPosition = new THREE.Vector3(20969.368762656006, 21203.296709545128, 21156.31191586029);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x382828);
    this.scene.add(this.ambientLight);

    // Directional light
    this.light = new THREE.DirectionalLight(0xEEEEEE, 2);
    this.light.position.set(-100000, 0, 0);
    this.scene.add(this.light);

    // Explosion lights
    this.lightPool = [];
    while (this.lightPool.length < 20) {
      var light = new THREE.PointLight(0xF16718, 0.45, 2500);
      scene.add(light);
      this.lightPool.push(light);
    }

    // Add moon
    this.moon = new s.Moon({
      game: this
    });

    // Add spacestation
    this.spaceStation = new s.SpaceStation({
      game: this
    });

    // Add tall moon base
    this.moonBase = new s.MoonBaseTall({
      game: this
    });

    // // Add a hud
    // this.HUD = new s.HUD({
    //     game: this
    // });

    var player = this.player = new s.Player({
      HUD: this.HUD,
      game: this,
      name: 'Player',
      position: this.startingPosition.clone(),
      shipClass: 'human_ship_heavy',
      team: 'alliance',
      camera: this.camera
    });

    this.player.on('fire', s.util.throttle(function() {
      player.root.updateMatrixWorld();

      var instance = new s.WeaponPlasma({
        game: s.game,
        velocity: player.body.velocity,
        position: new THREE.Vector3(50, -10, 300).applyMatrix4(player.root.matrixWorld),
        rotation: player.root.quaternion,
        team: player.team
      });

      var instance = new s.WeaponPlasma({
        game: s.game,
        velocity: player.body.velocity,
        position: new THREE.Vector3(-50, -10, 300).applyMatrix4(player.root.matrixWorld),
        rotation: player.root.quaternion,
        team: player.team
      });
    }, 125));

    // Moon facing
    this.player.lookAt(this.moon.root.position);

    // this.player.root.addEventListener('ready', function(){
    // s.game.start();
    // });
    s.game.start();

    this.addSkybox();
    this.addDust();

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
      this.player.root.add(sprite);
      sprite.position.set(0, 0, (i+1) * 10 - 100);
    }

    this.trailGlow = new THREE.PointLight(0x00FFFF, 5, 20);
    this.player.root.add(this.trailGlow);
    this.trailGlow.position.set(0, 0, 35);

    // Fly controls
    this.controls = new s.Controls({
        game: this,
        player: this.player,
        camera: this.camera
    });
  },

  render: function(time) {
    this._super.call(this, time);

    // Adjusts engine glow based on linear velocity
    this.trailGlow.intensity = this.controls.thrustImpulse / 5;

    var flameScaler = (Math.random()*0.1 + 1);
    this.flames[0].scale.set(this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[0]*this.trailGlow.intensity*flameScaler);
    this.flames[1].scale.set(this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[1]*this.trailGlow.intensity*flameScaler);
    this.flames[2].scale.set(this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[2]*this.trailGlow.intensity*flameScaler);
    this.flames[3].scale.set(this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[3]*this.trailGlow.intensity*flameScaler);
    this.flames[4].scale.set(this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler, this.flameMultiplier[4]*this.trailGlow.intensity*flameScaler);
  },

  addSkybox: function() {
    var urlPrefix = "game/textures/skybox/Purple_Nebula_";
    var urls = [
      urlPrefix + "right1.png", urlPrefix + "left2.png",
      urlPrefix + "top3.png", urlPrefix + "bottom4.png",
      urlPrefix + "front5.png", urlPrefix + "back6.png"
    ];

    THREE.ImageUtils.loadTextureCube(urls, {}, function(textureCube) {
      textureCube.format = THREE.RGBFormat;
      var shader = THREE.ShaderLib.cube;

      var uniforms = THREE.UniformsUtils.clone(shader.uniforms);
      uniforms.tCube.value = textureCube;

      var material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: uniforms,
        side: THREE.BackSide
      });

      this.skyboxMesh = new THREE.Mesh(new THREE.BoxGeometry(200000, 200000, 200000, 1, 1, 1, null, true), material);
      this.scene.add(this.skyboxMesh);
    }.bind(this));
  },

  addDust: function() {
    var starSprite = THREE.ImageUtils.loadTexture('game/textures/particle.png');
    var geometry = new THREE.Geometry();

    // Set to false for "dust", true for stars
    var outer = true;

    // Spec size
    var radius = 100000;
    var size = 100;
    var count = 1000;

    for (var i = 0; i < count; i ++) {

      var vertex = new THREE.Vector3();

      if (outer) {
        // Distribute "stars" on the outer bounds of far space
        vertex.x = Math.random() * 2 - 1;
        vertex.y = Math.random() * 2 - 1;
        vertex.z = Math.random() * 2 - 1;
        vertex.multiplyScalar(radius);
      } else {
        // Distribute "dust" throughout near space
        vertex.x = Math.random() * radius - radius / 2;
        vertex.y = Math.random() * radius - radius / 2;
        vertex.z = Math.random() * radius - radius / 2;
      }

      geometry.vertices.push(vertex);

    }

    var material = new THREE.ParticleBasicMaterial({
      size: size,
      map: starSprite,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true
    });

    this.dust = new THREE.ParticleSystem(geometry, material);

    this.scene.add(this.dust);
  },

  getStartPosition: function() {
    return new THREE.Vector3(s.util.getRandomCoordinate(), s.util.getRandomCoordinate(), s.util.getRandomCoordinate());
  }
});