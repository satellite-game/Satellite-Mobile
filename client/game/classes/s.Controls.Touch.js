s.Controls.Touch = function() {
  this.stickMode = 'yaw'; // 'roll'

  this.handleTouches = this.handleTouches.bind(this);
  this.setScreenVariables = this.setScreenVariables.bind(this);

  this.fire = false;

  // Joysticks
  var joyWidth = 240;
  var joyOptions = {
    width: joyWidth,
    deadZone: joyWidth * 0.10,
    margin: joyWidth * 0.15
  };

  this.joyStick = new s.Controls.Touch.Joystick(joyOptions);

  // Buttons
  var buttonWidth = 96;
  var buttonOptions = {
    width: buttonWidth,
    margin: buttonWidth * 0.025
  };

  this.fireButton = new s.Controls.Touch.Button({
    width: 128,
    margin: 128 * 0.025,
    text: 'fire',
    color: 'red'
  });

  this.retroThrustButton = new s.Controls.Touch.Button(s.util.extend({}, buttonOptions, {
    text: 'back',
    color: 'blue'
  }));

  this.thrustButton = new s.Controls.Touch.Button(s.util.extend({}, buttonOptions, {
    text: 'forward',
    color: 'blue'
  }));

  this.leftButton = new s.Controls.Touch.Button(s.util.extend({}, buttonOptions, {
    text: 'left',
    color: 'white'
  }));

  this.rightButton = new s.Controls.Touch.Button(s.util.extend({}, buttonOptions, {
    text: 'right',
    color: 'white'
  }));

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
  var joyWidth = this.joyStick.width;
  var joyMargin = this.joyStick.margin;

  var fireButtonWidth = this.fireButton.width;
  var buttonWidth = this.thrustButton.width;
  var buttonMargin = this.thrustButton.margin;

  var joyX = this.width - joyMargin - joyWidth/2;
  var joyY = this.height - joyMargin - joyWidth/2;

  var buttonX = 0 + fireButtonWidth + buttonWidth/2;
  var buttonY = this.height - fireButtonWidth - buttonWidth/2;

  var buttonOffset = buttonWidth * 0.75;

  this.joyStick.configure({
    position: {
      x: joyX,
      y: joyY
    }
  });

  this.thrustButton.configure({
    position: {
      x: buttonX,
      y: buttonY - buttonOffset
    }
  });

  this.retroThrustButton.configure({
    position: {
      x: buttonX,
      y: buttonY + buttonOffset
    }
  });

  this.fireButton.configure({
    position: {
      x: buttonX,
      y: buttonY
    }
  });

  this.leftButton.configure({
    position: {
      x: buttonX - buttonOffset,
      y: buttonY
    }
  });

  this.rightButton.configure({
    position: {
      x: buttonX + buttonOffset,
      y: buttonY
    }
  });
};

s.Controls.Touch.prototype.handleTouches = function(evt) {
  // Stop scrolling
  evt.preventDefault();

  this.fire = false;

  // Reset state before trying each touch
  this.joyStick.reset();
  this.fireButton.reset();
  this.thrustButton.reset();
  this.retroThrustButton.reset();
  this.leftButton.reset();
  this.rightButton.reset();

  for (var i = 0; i < evt.touches.length; i++) {
    var touch = evt.touches[i];

    this.retroThrustButton.update(touch);
    this.thrustButton.update(touch);
    this.fireButton.update(touch);
    this.joyStick.update(touch);
    this.leftButton.update(touch);
    this.rightButton.update(touch);
  }

  this.pitch = 0;
  this.roll = 0;
  this.yaw = 0;
  this.thrust = 0;
  this.fire = false;

  this.pitch = this.joyStick.y;
  if (this.stickMode === 'roll') {
      this.roll = this.joyStick.x;
      if (this.leftButton.pressed) {
          this.yaw = 0.125; //-1;
      }
      else if (this.rightButton.pressed) {
          this.yaw = -0.125; //1;
      }
  }
  else if (this.stickMode === 'yaw') {
      this.yaw = -1 * this.joyStick.x;
      if (this.leftButton.pressed) {
          this.roll = -0.25 // -1;
      }
      else if (this.rightButton.pressed) {
          this.roll = 0.25 // 1;
      }
  }

  if (this.thrustButton.pressed) {
    this.thrust = 1;
  }
  else if (this.retroThrustButton.pressed) {
    this.thrust = -1;
  }

  this.fire = this.fireButton.pressed;
};
