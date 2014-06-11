(function() {
  s.Explosion = new Class({
    extend: s.GameObject,

    construct: function(options){
      var size = options.size || 20;
      var geometry = new THREE.Geometry();
      for (var i = 0; i < 10; i++){
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * size - 10;
        vertex.y = Math.random() * size - 10;
        vertex.z = Math.random() * size - 10;
        geometry.vertices.push(vertex);
      }

      // Re-use material
      var material = new THREE.ParticleBasicMaterial({
        color: 0xFFFFFF,
        size: 300,
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
        setTimeout(function() {
          self.destruct();
        }, 0);
      }
    }
  });
})();