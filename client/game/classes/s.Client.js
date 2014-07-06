s.Client = function(options) {
  this.socket = io();
  this.player = options.player;

  this.socket.emit('join', {
    name: 'TestPlayer',
    matchName: 'default'
  });

  this.player.on('fire', this.send.bind(this, 'fire'));
};

s.Client.prototype.update = function(now, delta) {
  this.send('state', this.player.getState());
};

s.Client.prototype.send = function(eventName, data) {
  // Convert objects into arrays
  for (var prop in data) {
    var obj = data[prop];
    if (obj instanceof THREE.Vector3 || obj instanceof CANNON.Vec3) {
      data[prop] = [obj.x, obj.y, obj.z];
    }
    else if (obj instanceof THREE.Quaternion || obj instanceof CANNON.Quaternion) {
      data[prop] = [obj.x, obj.y, obj.z, obj.w];
    }
  }

  this.socket.emit(eventName, data);
};
