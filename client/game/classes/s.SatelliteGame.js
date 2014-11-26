s.SatelliteGame = function() {
  s.Game.call(this);

  this.curExplosionLight = 0;
  this.explosionLights = [];
};

s.SatelliteGame.prototype = Object.create(s.Game.prototype);
s.SatelliteGame.prototype.constructor = s.SatelliteGame;

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

  this.map = {};

  // Fade explosion lights
  this.hook(this.fadeLights.bind(this));

  // Create the ship chooser
  var shipChooser = this.shipChooser = new s.ShipChooser({
    game: this
  });

  shipChooser.on('shipSelected', function(event) {
    // Join game
    player.joinTeam(event.team, event.cls);

    // Get rid of the ship chooser
    shipChooser.destruct();
  });

  // Create the player
  var player = this.player = new s.Player({
    game: this,
    camera: this.camera
  });

  // Join the default match
  this.player.joinMatch('default', name);

  // Position the camera
  // this.camera.position.set(10000, 10000, 10000);
  // this.camera.lookAt(new THREE.Vector3(20000, 300000, 375000));

  this.camera.position.set(20000, 20000, 20000);
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));

  this.scene.add(this.camera);

  // Start the game
  this.start();
};

/**
  Include the map
*/
s.SatelliteGame.prototype.setMap = function(map) {
  var item;
  var id;

  console.log('Setting up map with %d items', Object.keys(map.items).length);

  // Remove the old map
  for (id in this.map.items) {
    item = this.map.items[id];
    if (item) {
      // Don't try to destruct items we blew away already
      item.destruct();
    }
  }

  // Use the new map
  this.map = map;

  // Add each map object
  for (id in map.items) {
    item = map.items[id];
    var Class = s[item.cls];

    if (!Class) {
      console.error('Invalid map item class: %s', item.cls);
      continue;
    }

    // Don't add destroyed items
    if (item.hp <= 0) {
      console.log('Skipping %s', item.cls);
      continue;
    }

    var instance = new Class({
      game: this,
      name: item.name,
      id: id,
      team: item.team,
      hp: item.hp,
      position: item.pos,
      rotation: item.rot
    });

    // Replace info with instance
    map.items[id] = instance;
  }
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

  var material = new THREE.PointCloudMaterial({
    size: size,
    map: starSprite,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true
  });

  this.dust = new THREE.PointCloud(geometry, material);

  this.scene.add(this.dust);
};
