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
    'crosshairs.png',
    'phobos.jpg',
    'phobos.jpg',
    'human_space_station_color.png',
    'human_space_station_bump.gif',
    'human_ship_light.jpg',
    'human_ship_light_bump.jpg',
    'human_ship_heavy.jpg',
    'human_ship_heavy_bump.jpg',
    'human_building_tall_color.jpg',
    'human_building_tall_bump.jpg',
    'human_building_short_color.jpg',
    'human_building_short_bump.jpg',
    'skybox/Purple_Nebula_back6.png',
    'skybox/Purple_Nebula_bottom4.png',
    'skybox/Purple_Nebula_front5.png',
    'skybox/Purple_Nebula_left2.png',
    'skybox/Purple_Nebula_right1.png',
    'skybox/Purple_Nebula_top3.png'
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

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x382828);
    this.scene.add(this.ambientLight);

    // Directional light
    this.light = new THREE.DirectionalLight(0xEEEEEE, 2);
    this.light.position.set(100000, 50000, 50000);
    this.scene.add(this.light);

    // Explosion lights
    // @perf: iOS: 5 lights makes the framerate drop to 40, whereas 20 lights halves it
    while (this.explosionLights.length < 3) {
      var light = new THREE.PointLight(0xF16718, 0.45, 2500);
      this.scene.add(light);
      this.explosionLights.push(light);
    }

    // Add moon
    this.moon = new s.Moon({
      game: this
    });

    // Add spacestation
    this.spaceStation = new s.SpaceStation({
      game: this,
      team: 'alliance',
      position: new THREE.Vector3(20000, 20000, 20000),
      rotation: new THREE.Quaternion(0.034971379498817616, 0.3468714418444932, -0.27655401457101153, -0.8955306150396697)
    });

    // Add tall moon base
    this.moonBase1 = new s.BuildingTall({
      game: this,
      team: 'rebel',
      position: new THREE.Vector3(-3202.4802401107377, 1894.8442691216867, 3839.9961391320685),
      rotation: new THREE.Quaternion(-0.17990696233627135, -0.45340581037032207, -0.37852982963312304, -0.786620508315977)
    });

    this.moonBase2 = new s.BuildingShort({
      game: this,
      team: 'rebel',
      position: new THREE.Vector3(-3582.224014746993, 2110.7667637886925, 3387.119769191431),
      rotation: new THREE.Quaternion(-0.35407504525506794, -0.02522594297569987, -0.2368707669391499, -0.9043709161059235)
    });

    this.moonBase3 = new s.BuildingShort({
      game: this,
      team: 'rebel',
      position: new THREE.Vector3(-3506.2446102564877, 1883.3176856045577, 3667.1759831868803),
      rotation: new THREE.Quaternion(-0.3447861720355756, -0.02279656928332127, -0.23711690056676846, -0.9079528553110975)
    });

    // Add a hud
    this.HUD = new s.HUD({
      game: this
    });

    var player = this.player = new s.Player({
      HUD: this.HUD,
      game: this,
      name: 'Player',
      shipClass: 'human_ship_heavy',
      team: 'alliance',
      camera: this.camera,

      // Nice outside angle
      // position: new THREE.Vector3(22765.105955147825, 22878.477872164884, 22005.84642690411),
      // rotation: new THREE.Quaternion(-0.2840628330856818, 0.8298857037518823, -0.19073508075184492, -0.4407018885121397)

      // Inside docking bay
      position: new THREE.Vector3(19562.491512697547, 19618.948414021877, 19988.645332582022),
      rotation: new THREE.Quaternion(-0.17750835538730667, 0.8755285517609332, -0.23197996825512426, -0.38487119033184075) 
    });

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
  }
});