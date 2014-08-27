s.SatelliteGame = function() {
  s.Game.call(this);

  this.curExplosionLight = 0;
  this.explosionLights = [];
};

s.SatelliteGame.prototype = Object.create(s.Game.prototype);

// Models that should be loaded
s.SatelliteGame.prototype.models = [
  'alien_ship_heavy',
  'alien_ship_light',
  'human_ship_heavy',
  'human_ship_light',
  'human_space_station',
  'human_building_short',
  'human_building_tall'
];

s.SatelliteGame.prototype.textures = [
  'particle.png',
  'explosion.png',
  'crosshairs.png',
  'moon.jpg',
  'human_space_station_color.png',
  'human_space_station_bump.gif',
  'human_ship_light.jpg',
  'human_ship_light_bump.jpg',
  'human_ship_heavy.jpg',
  'human_ship_heavy_bump.jpg',
  'alien_ship_light_color.jpg',
  'alien_ship_light_bump.jpg',
  'alien_ship_heavy_color.jpg',
  'alien_ship_heavy_bump.jpg',
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
];

/**
  Called after all models and textures are laoded
*/
s.SatelliteGame.prototype.initialize = function() {
  // Ambient light
  this.ambientLight = new THREE.AmbientLight(0x382828);
  this.scene.add(this.ambientLight);

  // Directional light
  var light = this.light = new THREE.DirectionalLight(0xEEEEEE, 2);
  light.position.set(100000, 50000, 50000);
  this.scene.add(light);

  // Shadow light
  if (s.config.shadows) {
    var shadowLight = this.shadowLight = new THREE.SpotLight(0xFFFFFF, 2, 0);
    shadowLight.position.set(10000, 10000, 10000);
    shadowLight.target.position.set(0, 0, 0);

    shadowLight.castShadow = true;
    shadowLight.onlyShadow = true;

    shadowLight.shadowCameraNear = 2500;
    shadowLight.shadowCameraFar = 12000;
    shadowLight.shadowCameraFov = 45;

    shadowLight.shadowCameraVisible = true;

    shadowLight.shadowMapWidth = 4096;
    shadowLight.shadowMapHeight = 4096;
    this.scene.add(shadowLight);
  }

  // Create a set of explosion lights we'll reuse across the game
  // @perf: iOS: 5 lights makes the framerate drop to 40, whereas 20 lights halves it
  while (this.explosionLights.length < 3) {
    var pointLight = new THREE.PointLight(0x72b3fd, 0.45, 2500);
    this.scene.add(pointLight);
    this.explosionLights.push(pointLight);
  }

  // Dust and skybox
  this.addSkybox();
  this.addDust();

  // Add moon
  this.moon = new s.Moon({
    game: this
  });

  // Add spacestation
  this.spaceStation = new s.SpaceStation({
    game: this,
    team: 'human',
    position: new THREE.Vector3(34909.57019523937, -3518.1015191242786, 6165.897081138204),
    rotation: new THREE.Quaternion(-0.2557681600381702, 0.7161396699284692, 0.2863470690590406, -0.5828653167814406)
  });

  // Add tall moon base
  this.moonBase1 = new s.BuildingTall({
    game: this,
    team: 'alien',
    position: new THREE.Vector3(-3202.4802401107377, 1894.8442691216867, 3839.9961391320685),
    rotation: new THREE.Quaternion(-0.17990696233627135, -0.45340581037032207, -0.37852982963312304, -0.786620508315977)
  });

  this.moonBase2 = new s.BuildingShort({
    game: this,
    team: 'alien',
    position: new THREE.Vector3(-3582.224014746993, 2110.7667637886925, 3387.119769191431),
    rotation: new THREE.Quaternion(-0.35407504525506794, -0.02522594297569987, -0.2368707669391499, -0.9043709161059235)
  });

  this.moonBase3 = new s.BuildingShort({
    game: this,
    team: 'alien',
    position: new THREE.Vector3(-3506.2446102564877, 1883.3176856045577, 3667.1759831868803),
    rotation: new THREE.Quaternion(-0.3447861720355756, -0.02279656928332127, -0.23711690056676846, -0.9079528553110975)
  });

  // Create the player
  var player = this.player = new s.Player({
    game: this,
    camera: this.camera
  });

  // Fade explosion lights
  this.hook(this.fadeLights.bind(this));

  // Start the game
  this.start();
 
  // @temp get vars from hash
  var name = window.location.hash || 'Player '+Date.now().toString().slice(-5);
  var team = window.location.hash.indexOf('alien') !== -1 ? 'alien': 'human';
  var shipClass = window.location.hash.indexOf('light') !== -1 ? 'light': 'heavy';

  // Join match
  this.player.joinMatch('default', name);

  // Join game
  this.player.joinTeam(team, shipClass);
};

/**
  Constantly fade explosion lights to zero
*/
s.SatelliteGame.prototype.fadeLights = function(x, delta) {
  this.explosionLights.forEach(function(light) {
    if (light.intensity > 0) {
      light.intensity -= 0.001 * delta;
    }
  });
};

/**
  Move an explosion light to the provided position
*/
s.SatelliteGame.prototype.putLightAt = function(position) {
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
};

// @todo: refactor as a separate constructor
s.SatelliteGame.prototype.addSkybox = function() {
  var urlPrefix = 'game/textures/skybox/Purple_Nebula_';
  var urls = [
    urlPrefix + 'right1.png', urlPrefix + 'left2.png',
    urlPrefix + 'top3.png', urlPrefix + 'bottom4.png',
    urlPrefix + 'front5.png', urlPrefix + 'back6.png'
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
};

// @todo: refactor as a separate constructor
s.SatelliteGame.prototype.addDust = function() {
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
};
