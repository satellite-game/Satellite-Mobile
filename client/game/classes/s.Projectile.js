s.Projectile = new Class({
	extend: s.GameObject,

    flightTime: 4000,

    construct: function(options){
        // handle parameters
        var self = this;

        // Destory projectile after 4 secs
        this._flightTimeout = setTimeout(function(){
            self.destruct();
        }, this.flightTime);
    },

    destruct: function() {
        clearTimeout(this._flightTimeout);
    },

	init: function(){
        this._super.call(this);

        // Make sure the matrix is up to date before we try to use it
        this.root.updateMatrix();

        var body = this.body;
        var rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(this.root.matrix);

        // Apply impulse
        var forceVector = new THREE.Vector3(0, 0, this.velocity).applyMatrix4(rotationMatrix);
        var cannonVector = new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z);
        body.applyImpulse(cannonVector, body.position);
    }
});
