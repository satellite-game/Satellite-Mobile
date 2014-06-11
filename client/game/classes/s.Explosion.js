(function() {
  s.Explosion = new Class({
    extend: s.GameObject,

    construct: function(options){
      var size = options.size || 300;
      var spread = options.spread || 20;
      var geometry = new THREE.Geometry();

      // @perf: iOS: More than 3 halves framerate up close
      for (var i = 0; i < 3; i++){
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * spread - 10;
        vertex.y = Math.random() * spread - 10;
        vertex.z = Math.random() * spread - 10;
        geometry.vertices.push(vertex);
      }

      // Re-use material
      var material = new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: size,
        map: s.textures.explosion,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });

      this.root = new THREE.Object3D();

      var particles = this.particles = new THREE.ParticleSystem(geometry, material);
      particles.sortParticles = true;
      this.root.add(particles);

      this.startTime = null;
      this.animationTime = 1000;
    },

    init: function() {
      this._super();
      this.game.putLightAt(this.root.position);
    },
 
    update: function(){
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
        var self = this;
        this.destructOnNextTick();
      }
    }
  });
})();