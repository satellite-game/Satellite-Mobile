s.Explosion = function(options) {
  s.GameObject.call(this, options);

  var size = options.size || 300;
  var spread = options.spread || size / 15;
  var geometry = new THREE.Geometry();

  // @perf: iOS: More than 3 explosion sprites halves framerate camera is close
  for (var i = 0; i < 3; i++) {
    var vertex = new THREE.Vector3();
    vertex.x = Math.random() * spread - spread/2;
    vertex.y = Math.random() * spread - spread/2;
    vertex.z = Math.random() * spread - spread/2;
    geometry.vertices.push(vertex);
  }

  var material = s.Explosion.material = s.Explosion.material || new THREE.PointCloudMaterial({
    color: options.color || 0xFFFFFF,
    size: size,
    map: s.textures.explosion,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
  });

  this.root = new THREE.PointCloud(geometry, material);
  // this.root.sortParticles = false;
  // this.root.frustrumCulled = false;

  this.startTime = null;
  this.animationTime = 1000;

  this.init();
};

s.Explosion.prototype = Object.create(s.GameObject.prototype);
s.Explosion.prototype.constructor = s.Explosion;

s.Explosion.prototype.init = function() {
  s.GameObject.prototype.init.call(this);

  this.game.putLightAt(this.root.position);
};

s.Explosion.prototype.update = function() {
  s.GameObject.prototype.update.apply(this, arguments);

  // @todo don't create Date instances to get time
  if (this.startTime === null) {
    this.startTime = new Date().getTime();
  }

  var progress = new Date().getTime() - this.startTime;
  var proportionalProgress = progress/this.animationTime;
  var scale = 8 * proportionalProgress;

  if (scale) {
    // Don't try to set 0 scale
    this.root.scale.set(scale, scale, scale);
  }

  // We can't do this since we're reusing material :-\
  // this.root.material.opacity = 1 - proportionalProgress;

  // Destroy after animation complete
  if (progress > this.animationTime) {
    this.destructOnNextTick();
  }
};
