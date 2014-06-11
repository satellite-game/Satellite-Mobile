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

  construct: function() {
    this.curExplosionLight = 0;
    this.explosionLights = [];
  },

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
    // @perf: iOS: 5 lights makes the framerate drop to 40, whereas 20 lights halves it
    while (this.explosionLights.length < 3) {
      var light = new THREE.PointLight(0xF16718, 0.45, 2500);
      scene.add(light);
      this.explosionLights.push(light);
    }

    // Add moon
    this.moon = new s.Moon({
      game: this
    });

    // Add spacestation
    this.spaceStation = new s.SpaceStation({
      game: this,
      team: 'alliance'
    });

    // Add tall moon base
    this.moonBase = new s.BuildingTall({
      game: this,
      team: 'rebel'
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
        position: player.offsetGunLeft.clone().add(player.offsetBullet).applyMatrix4(player.root.matrixWorld),
        rotation: player.root.quaternion,
        team: player.team
      });

      var instance = new s.WeaponPlasma({
        game: s.game,
        velocity: player.body.velocity,
        position: player.offsetGunRight.clone().add(player.offsetBullet).applyMatrix4(player.root.matrixWorld),
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

    // Fly controls
    this.controls = new s.Controls({
        game: this,
        player: this.player,
        camera: this.camera
    });

    this.hook(this.fadeLights.bind(this));
  },

  fadeLights: function(x, delta) {
    this.explosionLights.forEach(function(light) {
      if (light.intensity > 0) {
        light.intensity -= 0.001 * delta;
      }
    });
  },

  putLightAt: function(position) {
    this.curExplosionLight++;
    if (this.curExplosionLight >= this.explosionLights.length) {
      this.curExplosionLight = 0;
    }

    // Get the light
    var light = this.explosionLights[this.curExplosionLight];

    // Place the light
    light.position.copy(position);

    // Reset fade
    light.intensity = 1;
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