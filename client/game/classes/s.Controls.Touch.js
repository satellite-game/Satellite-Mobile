s.Controls.Touch = function() {
  this.handleTouches = this.handleTouches.bind(this);
  this.setScreenVariables = this.setScreenVariables.bind(this);

  this.fire = false;

  // Joysticks
  var joyWidth = window.innerWidth / 3.5;
  var joyOptions = {
    // binary: true, // Don't calculate joystick position along a continuum (8 position joystick)
    width: joyWidth,
    deadZone: joyWidth * 0.25,
    margin: joyWidth * 0.15
  };

  this.rightStick = new s.Controls.Touch.Joystick(joyOptions);
  this.leftStick = new s.Controls.Touch.Joystick(joyOptions);

  // Buttons
  var buttonWidth = joyWidth * 0.40;
  var buttonOptions = {
    width: buttonWidth,
    margin: buttonWidth * 0.025
  };

  var fireButtonWidth = joyWidth * 0.50
  this.fireButton = new s.Controls.Touch.Button({
    width: fireButtonWidth,
    margin: fireButtonWidth * 0.025,
    fill: 'rgba(255, 0, 0, 0.5)',
    color: 'red'
  });

  // Set parameters
  this.setScreenVariables();

  // Listen to events
  window.addEventListener('touchstart', this.handleTouches, false);
  window.addEventListener('touchmove', this.handleTouches, false);
  window.addEventListener('touchend', this.handleTouches, false);
  window.addEventListener('resize', this.setScreenVariables, false);
};

s.Controls.Touch.prototype.destruct = function() {
  window.removeEventListener('resize', this.setScreenVariables, false);
  window.removeEventListener('touchstart', this.handleTouches, false);
  window.removeEventListener('touchmove', this.handleTouches, false);
  window.removeEventListener('touchend', this.handleTouches, false);
};

s.Controls.Touch.prototype.setScreenVariables = function() {
  this.width = window.innerWidth;
  this.height = window.innerHeight;

  // Use previously passed margin
  var joyWidth = this.rightStick.width;
  var joyMargin = this.rightStick.margin;

  var fireButtonWidth = this.fireButton.width;

  var joyX = this.width - joyMargin - joyWidth/2;
  var joyY = this.height - joyMargin - joyWidth/2;

  var leftControlX = joyMargin + joyWidth/2;

  this.rightStick.configure({
    position: {
      x: joyX,
      y: joyY
    }
  });

  this.leftStick.configure({
    position: {
      x: leftControlX,
      y: joyY
    }
  });

  this.fireButton.configure({
    position: {
      x: leftControlX,
      y: joyY
    }
  });
};

s.Controls.Touch.prototype.handleTouches = function(evt) {
  // Stop scrolling
  evt.preventDefault();

  this.fire = false;

  // Reset state before trying each touch
  this.rightStick.reset();
  this.leftStick.reset();
  this.fireButton.reset();

  for (var i = 0; i < evt.touches.length; i++) {
    var touch = evt.touches[i];

    this.rightStick.update(touch);
    this.leftStick.update(touch);
    this.fireButton.update(touch);
  }

  this.pitch = 0;
  this.roll = 0;
  this.yaw = 0;
  this.thrust = 0;
  this.fire = false;

  this.pitch = this.rightStick.y;
  this.yaw = -1 * this.rightStick.x;

  // If Y is outside the deadzone, give full thrust
  if (this.leftStick.y > 0) {
    this.thrust = 1;
  }
  else if (this.leftStick.y < 0) {
    this.thrust = -1;
  }

  // If X is outside the deadzone, give partial roll
  if (this.leftStick.x > 0) {
    this.roll = 0.75;
  }
  else if (this.leftStick.x < 0) {
    this.roll = -0.75;
  }

  this.fire = this.fireButton.pressed;
};
