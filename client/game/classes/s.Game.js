s.Game = function(options) {
  var self = this;

  this.doRender = false;
  this.lastRender = 0;

  // Store functions that should be called before render
  this.hookedFuncs = [];

  // Store functions that should be called once
  this.nextTickFuncs = [];

  // Bind render function permenantly
  this.render = this.render.bind(this);

  // Create renderer
  var renderer = this.renderer = new THREE.WebGLRenderer({
    antialias: false
  });

  // Enable alpha
  renderer.setClearColor(0x000000, 0);

  // Create a camera
  var camera = this.camera = new THREE.PerspectiveCamera(35, 1, 1, 300000);

  // Configure shadows
  if (s.config.shadows) {
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFShadowMap;
  }

  // Create the scene
  var scene = this.scene = new THREE.Scene();

  // Initialize physics engine
  var world = this.world = new CANNON.World();
  world.gravity.set(0,0,0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Add the camera to the scene
  // this.scene.add(this.camera);

  // Add the renderer's canvas to the DOM
  this.el = this.renderer.domElement;
  this.$el = $(this.el).appendTo(document.body);

  // Handle window resizes
  $(window)
    .on('resize', this.fitWindow.bind(this));
  this.fitWindow();

  // Handle pointer lock changes
  // Handle fullscreen state changes
  $(document)
    .on('pointerlockchange mozpointerlockchange webkitpointerlockchange', this.handlePointerLockChange.bind(this))
    .on('fullscreenchange mozfullscreenchange webkitfullscreenchange', this.handleFullscreenChange.bind(this))
    .on('pointerlockerror mozpointerlockerror webkitpointerlockerror', this.handlePointerLockError.bind(this));
  this.handleFullscreenChange();

  // Monitor rendering stats
  this.renderStats = new Stats();
  this.$renderStats = $(this.renderStats.domElement).hide().addClass('s-FPS').appendTo(document.body);

  // Loading progress
  this.$loadingOverlay = $('.js-loadingOverlay');
  this.$loadingBar = $('.js-progressBar');
  this.loadProgress = {
    models: 0,
    textures: 0
  };

  // Start loading models
  s.util.loadModels({
    models: this.models,
    progress: function(pct) {
      self.loadProgress.models = pct;
      self.updateLoadProgress();
    },
    complete: function(models) {
      self.modelsLoaded = true;

      // Store loaded models
      s.models = models;

      // Attempt to start the game
      self.tryInitialize(this);
    }
  });

  s.util.loadTextures({
    textures: this.textures,
    progress: function(pct) {
      self.loadProgress.textures = pct;
      self.updateLoadProgress();
    },
    complete: function(textures) {
      self.texturesLoaded = true;

      // Store loaded textures
      s.textures = textures;

      // Attempt to start the game
      self.tryInitialize(this);
    }
  });
};

s.Game.prototype.updateLoadProgress = function() {
  var totalPct = (this.loadProgress.models + this.loadProgress.textures) / 2;
  this.$loadingBar.css('width', totalPct+'%');
};

// Attempt to start the game
s.Game.prototype.tryInitialize = function() {
  if (this.modelsLoaded && this.texturesLoaded && !this.initialized) {
    console.log('Loading complete!');

    // Show rendering stats
    this.$renderStats.show();

    // Hide loading status
    this.$loadingBar.css('width', '100%');
    this.$loadingOverlay.fadeOut();

    // Start game
    this.initialize();
  }
};

s.Game.prototype.isFullScreen = function() {
  return (screen.width === window.outerWidth && screen.height === window.outerHeight);
};

s.Game.prototype.handleFullscreenChange = function(evt) {
 if (this.isFullScreen()) {
   console.log('Full screen mode entered!');

   this.el.requestPointerLock = this.el.requestPointerLock ||
                                      this.el.mozRequestPointerLock ||
                                      this.el.webkitRequestPointerLock;
    this.el.requestPointerLock();
  } else {
    console.log('Full screen mode exited!');
  }
};

s.Game.prototype.toggleFullScreen = function() {
  if (!this.isFullScreen()) {
    if (document.documentElement.requestFullScreen) {
      document.documentElement.requestFullScreen();
    }
    else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    }
    else if (document.documentElement.webkitRequestFullScreen) {
      document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  }
  else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    }
    else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
};

s.Game.prototype.handlePointerLockChange = function() {
  if (document.mozPointerLockElement === this.el || document.webkitPointerLockElement === this.el) {
    console.log('Pointer Lock was successful.');
    this.pointerLocked = true;
  }
  else {
    console.log('Pointer Lock was lost.');
    this.pointerLocked = false;
  }
};

s.Game.prototype.handlePointerLockError = function() {
  console.log('Error while locking pointer.');
  this.pointerLocked = false;
};

// Size the renderer to fit the window
s.Game.prototype.fitWindow = function() {
  this.setSize(window.innerWidth, window.innerHeight);
};

// Set the size of the renderer
s.Game.prototype.setSize = function(width, height) {
  this.width = width;
  this.height = height;
  this.renderer.setSize(width, height);
  if (this.camera) {
    this.camera.aspect = width/height;
    this.camera.updateProjectionMatrix();
  }
};

// Call the provided callback once on the next rendering
s.Game.prototype.nextTick = function(callback) {
  this.nextTickFuncs.push(callback);
};

// Add a callback to the rendering loop
s.Game.prototype.hook = function(callback) {
  this.hookedFuncs.push(callback);
};

// Remove a callback from the rendering loop
s.Game.prototype.unhook = function(callback) {
  var index = this.hookedFuncs.indexOf(callback);
  if (~index)
    this.hookedFuncs.splice(index, 1);
};

// Start rendering
s.Game.prototype.start = function() {
  this.doRender = true;
  requestAnimationFrame(this.render);
};

s.Game.prototype.restart = function() {
  this.doRender = true;
  requestAnimationFrame(this.render);
};

// Stop rendering
s.Game.prototype.stop = function() {
  this.doRender = false;
};

// Perform render
s.Game.prototype.render = function(now) {
  // Store the current time
  this.now = now;

  if (this.doRender) {
    // Calculate the time since the last frame was rendered
    var delta = now - this.lastRender;
    this.lastRender = now;

    // Step the physics world
    this.world.step(delta/1000);

    // Run each next tick function before rendering
    this.nextTickFuncs.forEach(function(func) {
      func(now, delta);
    });

    // Reset so they don't run twice
    this.nextTickFuncs.length = 0;

    // Run each hooked function before rendering
    this.hookedFuncs.forEach(function(func) {
      func(now, delta);
    });

    this.renderer.render(this.scene, this.camera);

    // Request the next frame to be rendered
    requestAnimationFrame(this.render);

    this.renderStats.update();
  }
};
