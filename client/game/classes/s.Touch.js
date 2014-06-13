s.Touch = new Class({
  toString: 'Touch',

  _steerSize: 100,
  _deadZone: 0.15,

  construct: function(game, player) {
    var self = this;
    this.keyCodes = {};

    this.handleTouches = this.handleTouches.bind(this);

    // Listen to key events
    window.addEventListener('touchstart', this.handleTouches, false);
    window.addEventListener('touchmove', this.handleTouches, false);
    window.addEventListener('touchend', this.handleTouches, false);

    this.fire = false;
    this.leftStick = { x: 0, y: 0 };
    this.rightStick = { x: 0, y: 0 };
  },

  destruct: function() {
    window.removeEventListener('touchstart', this.handleTouches, false);
    window.removeEventListener('touchmove', this.handleTouches, false);
    window.removeEventListener('touchend', this.handleTouches, false);
  },

  handleTouches: function(evt) {
    // Stop scrolling
    evt.preventDefault();

    var width = window.innerWidth;
    var height = window.innerHeight;

    this.fire = false;
    this.leftStick.x =  0;
    this.leftStick.y =  0;
    this.rightStick.x =  0;
    this.rightStick.y =  0;

    for (var i = 0; i < evt.touches.length; i++) {
      var touch = evt.touches[i];

      // Determine zone
      var x = touch.clientX;
      var y = touch.clientY;

      var joyWidth = 240;
      var joyOffset = width * 0.05;
      var joyDeadZone = joyWidth * 0.10;

      var yCenter = height - joyOffset - joyWidth / 2;
      var xCenterLeft = joyOffset + joyWidth / 2;
      var xCenterRight = width - joyOffset - joyWidth/2;

      // Fire if Y is in top of screen
      if (y < height/2) {
        this.fire = true;
      }

      if (x > 0 && x < joyOffset * 2 + joyWidth && y > height - joyOffset * 2 - joyWidth && y < height) {
        var leftXInDeadZone = Math.abs(xCenterLeft - x) <= joyDeadZone;
        var leftYInDeadZone = Math.abs(yCenter - y) <= joyDeadZone;
        if (!leftXInDeadZone) {
          this.leftStick.x = (x - xCenterLeft) / (joyWidth / 2);
        }
        if (!leftYInDeadZone) {
          this.leftStick.y = (yCenter - y) / (joyWidth / 2);
        }
      }
      if (x > width - joyWidth - joyOffset * 2 && x < width && y > height - joyOffset * 2 - joyWidth && y < height) {
        var rightXInDeadZone = Math.abs(xCenterRight - x) <= joyDeadZone;
        var rightYInDeadZone = Math.abs(yCenter - y) <= joyDeadZone;
        if (!rightXInDeadZone) {
          this.rightStick.x = (x - xCenterRight) / (joyWidth / 2);
        }
        if (!rightYInDeadZone) {
          this.rightStick.y = (yCenter - y) / (joyWidth / 2);
        }
      }
    }
  }
});

