(function() {
  s.Explosion = new Class({
    extend: s.GameObject,

    construct: function(options){
      var size = options.size || 300;
      var spread = options.spread || size / 15;
      var geometry = new THREE.Geometry();

      // @perf: iOS: More than 3 halves framerate up close
      for (var i = 0; i < 3; i++){
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * spread - spread/2;
        vertex.y = Math.random() * spread - spread/2;
        vertex.z = Math.random() * spread - spread/2;
        geometry.vertices.push(vertex);
      }

      var material = new THREE.ParticleSystemMaterial({
        color: 0xFFFFFF,
        size: size,
        map: s.textures.explosion,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });

      this.root = new THREE.Object3D();

      var particles = this.particles = new THREE.ParticleSystem(geometry, material);
      // particles.sortParticles = false;
      // particles.frustrumCulled = false;
      this.root.add(particles);

      this.startTime = null;
      this.animationTime = 1000;
    },

    init: function() {
      this._super();
      this.game.putLightAt(this.root.position);
    },
 
    update: function(){
      this._super.apply(this, arguments);

      if (this.startTime === null){
        this.startTime = new Date().getTime();
      }

      var progress = new Date().getTime() - this.startTime;
      var proportionalProgress = progress/this.animationTime;
      var scale = 8 * proportionalProgress;
      this.particles.scale.set(scale,scale,scale);
      this.particles.material.opacity = 1 - proportionalProgress;

      // Destroy after animation complete
      if (progress > this.animationTime) {
        this.destructOnNextTick();
      }
    }
  });
})();