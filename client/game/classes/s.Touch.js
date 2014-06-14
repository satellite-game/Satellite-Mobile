s.Touch = new Class({
  toString: 'Touch',

  construct: function(game, player) {
    var self = this;
    this.keyCodes = {};

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

    this.leftStick = new s.Touch.Joystick(joyOptions);
    this.rightStick = new s.Touch.Joystick(joyOptions);

    // Set parameters
    this.setScreenVariables();

    // Listen to events
    window.addEventListener('touchstart', this.handleTouches, false);
    window.addEventListener('touchmove', this.handleTouches, false);
    window.addEventListener('touchend', this.handleTouches, false);
    window.addEventListener('resize', this.setScreenVariables, false);
  },

  setScreenVariables: function() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Use previously passed margin
    var joyMargin = this.leftStick.margin;
    var joyWidth = this.leftStick.width;

    var yCenter = this.height - joyMargin - joyWidth / 2;
    var xCenterLeft = joyMargin + joyWidth / 2;
    var xCenterRight = this.width - joyMargin - joyWidth/2;

    this.leftStick.configure({
      position: {
        x: xCenterLeft,
        y: yCenter
      }
    });

    this.rightStick.configure({
      position: {
        x: xCenterRight,
        y: yCenter
      }
    });
  },

  destruct: function() {
    window.removeEventListener('resize', this.setScreenVariables, false);
    window.removeEventListener('touchstart', this.handleTouches, false);
    window.removeEventListener('touchmove', this.handleTouches, false);
    window.removeEventListener('touchend', this.handleTouches, false);
  },

  handleTouches: function(evt) {
    // Stop scrolling
    evt.preventDefault();

    this.fire = false;

    // Reset state before trying each touch
    this.leftStick.reset();
    this.rightStick.reset();

    for (var i = 0; i < evt.touches.length; i++) {
      var touch = evt.touches[i];

      // Determine zone
      var x = touch.clientX;
      var y = touch.clientY;

      // Fire if Y is in top of screen
      if (y < this.height/2) {
        this.fire = true;
      }

      this.leftStick.update(touch);
      this.rightStick.update(touch);
    }
  }
});

