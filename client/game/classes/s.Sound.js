/**
  Extend Howl to do 3D sound based on player position
*/
s.Sound = function() {
  Howl.apply(this, arguments);
};

s.Sound.prototype = Object.create(Howl.prototype);

// Rotate around the Y axis so stereo is correct
s.Sound.prototype.axis = new THREE.Vector3(0, 1, 0);
s.Sound.prototype.angle = Math.PI;
s.Sound.prototype.matrix = new THREE.Matrix4().makeRotationAxis(s.Sound.prototype.axis, s.Sound.prototype.angle);

// The position of local sounds
// Use a negative Z so the sound comes from in front by default
// @todo verify Z should be negative to achieve the above effect
s.Sound.prototype.localPosition = { x: 0, y: 0, z: -0.5};

s.Sound.prototype.play = function(worldPosition, sprite, callback) {
  if (!s.config.sound.enabled) { return this; }

  // Sound is coming from player
  var localPosition = this.localPosition;

  if (worldPosition) {
    // Sound is coming from elsewhere
    // Copy the vector so we don't mess it up
    worldPosition = worldPosition.clone();

    // Convert the vector to the player's local coordinates
    // This modifies worldPosition itself
    localPosition = s.game.player.ship.root.worldToLocal(worldPosition);

    // Apply rotation
    localPosition.applyMatrix4(this.matrix);

    // Don't let audio fall off so quickly
    localPosition.multiplyScalar(1/1000);
  }

  // Set the 3D position of the sound
  this.pos3d(localPosition.x, localPosition.y, localPosition.z);

  // Play the sound
  return Howl.prototype.play.call(this, sprite, callback);
};
