s.Controls.Keyboard = function() {
  this.keyboard = new s.Keyboard();
};

s.Controls.Keyboard.prototype.update = function() {
  this.pitch = 0;
  this.roll = 0;
  this.yaw = 0;
  this.thrust = 0;
  this.fire = false;
  this.changeViewMode = false;
  this.showBackCam = false;

  if (this.keyboard.pressed('left')) {
    this.yaw = 1;
  }
  else if (this.keyboard.pressed('right')) {
    this.yaw = -1;
  }

  if (this.keyboard.pressed('down')) {
    // Pitch down
    this.pitch = -1;
  }
  else if (this.keyboard.pressed('up')) {
    // Pitch up
    this.pitch = 1;
  }

  if (this.keyboard.pressed('w')) {
    this.thrust = 1;
  }
  else if (this.keyboard.pressed('s')) {
    this.thrust = -1;
  }

  if (this.keyboard.pressed('d')) {
    this.roll = 1;
  }
  else if (this.keyboard.pressed('a')) {
    this.roll = -1;
  }

  if (this.keyboard.pressed('space')) {
    this.fire = true;
  }

  if (this.keyboard.pressed('q')) {
    this.showBackCam = true;
  }

  if (this.keyboard.pressed('v')) {
    this.changeViewMode = true;
  }
};
