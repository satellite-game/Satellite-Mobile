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
    this.startingPosition = this.getStartPosition();

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x382828);
    this.scene.add(this.ambientLight);

    // Directional light
    this.light = new THREE.DirectionalLight(0xEEEEEE, 2);
    this.light.position.set(-100000, 0, 0);
    this.scene.add(this.light);

    // Add moon
    this.moon = new s.Moon({
      game: this
    });

    /*
    // Add spacestation
    this.spaceStation = new s.SpaceStation({
      game: this
    });

    // Add tall moon base
    this.moonBaseTall = new s.MoonBaseTall({
      game: this
    });
    */

    // // Add a hud
    // this.HUD = new s.HUD({
    //     game: this
    // });

    this.player = new s.Player({
      HUD: this.HUD,
      game: this,
      shipClass: 'human_ship_heavy',
      position: new THREE.Vector3(this.startingPosition[0], this.startingPosition[1], this.startingPosition[2]),
      name: 'Player',
      rotation: new THREE.Vector3(0, Math.PI/2, 0),
      alliance: 'alliance',
      camera: this.camera
    });

    // Moon facing initilization
    this.player.root.lookAt(this.moon.root.position);
    
    s.game.start();
    // this.player.root.addEventListener('ready', function(){
    // s.game.start();
    // });

    this.addSkybox();
    this.addDust();

    // Engine glow
    // this.flames = [];

    // for (var i = 0; i < 5; i++) {
    //   var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    //     map: s.textures.particle,
    //     useScreenCoordinates: false,
    //     blending: THREE.AdditiveBlending,
    //     color: 0x00FFFF
    //   }));

    //   this.flames.push(sprite);
    //   this.player.root.add(sprite);
    //   sprite.position.set(0, 0, (i*10)+40);
    // }

    // this.trailGlow = new THREE.PointLight(0x00FFFF, 5, 20);
    // this.player.root.add(this.trailGlow);
    // this.trailGlow.position.set(0, 0, 35);
  },


  render: function(time) {
    this._super.call(this, time);

    // this.controls.update();
    // this.targeting.lookAt(this.player.root.position);
    // if (this.currentTarget) this.targeting.position.set(this.currentTarget.root.position);

    // Adjusts engine glow based on linear velocity
    // this.trailGlow.intensity = this.player.root.getLinearVelocity().length()/100;

    // var flameScaler = (Math.random()*0.1 + 1);
    // this.flames[0].scale.set(2*this.trailGlow.intensity*flameScaler, 2*this.trailGlow.intensity*flameScaler, 2*this.trailGlow.intensity*flameScaler);
    // this.flames[1].scale.set(3*this.trailGlow.intensity*flameScaler, 3*this.trailGlow.intensity*flameScaler, 3*this.trailGlow.intensity*flameScaler);
    // this.flames[2].scale.set(2*this.trailGlow.intensity*flameScaler, 2*this.trailGlow.intensity*flameScaler, 2*this.trailGlow.intensity*flameScaler);
    // this.flames[3].scale.set(1*this.trailGlow.intensity*flameScaler, 1*this.trailGlow.intensity*flameScaler, 1*this.trailGlow.intensity*flameScaler);
    // this.flames[4].scale.set(1*this.trailGlow.intensity*flameScaler, 1*this.trailGlow.intensity*flameScaler, 1*this.trailGlow.intensity*flameScaler);
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

  getRandomCoordinate: function(){
    var coefficient = 1;
    if (Math.random() > 0.5){
      coefficient = -1;
    }
    return Math.floor(Math.random()* 15000 + 15000) * coefficient;
  },

  getStartPosition: function() {
    return [this.getRandomCoordinate(), this.getRandomCoordinate(), this.getRandomCoordinate()];
  }
});