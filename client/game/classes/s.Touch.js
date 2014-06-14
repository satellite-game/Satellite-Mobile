s.Touch = new Class({
  toString: 'Touch',

  construct: function(game, player) {
    var self = this;
    this.keyCodes = {};

    this.handleTouches = this.handleTouches.bind(this);
    this.setScreenVariables = this.setScreenVariables.bind(this);

    this.fire = false;
    this.leftStick = { x: 0, y: 0 };
    this.rightStick = { x: 0, y: 0 };

    // Set parameters
    this.joyWidth = 240;
    this.joyDeadZone = this.joyWidth * 0.10;
    this.inputRange = { min: this.joyDeadZone / this.joyWidth * 2, max: 1.0};
    this.outputRange = { min: 0.0, max: 1.0};
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

    this.joyOffset = this.width * 0.05;

    this.yCenter = this.height - this.joyOffset - this.joyWidth / 2;
    this.xCenterLeft = this.joyOffset + this.joyWidth / 2;
    this.xCenterRight = this.width - this.joyOffset - this.joyWidth/2;
  },

  destruct: function() {
    window.removeEventListener('resize', this.setScreenVariables, false);
    window.removeEventListener('touchstart', this.handleTouches, false);
    window.removeEventListener('touchmove', this.handleTouches, false);
    window.removeEventListener('touchend', this.handleTouches, false);
  },

  rescaleJoyTouch: function(value) {
      var sign = value/Math.abs(value);
      value = Math.abs(value);
      if (value > this.inputRange.min && value < this.inputRange.max) {
        value = (value - this.inputRange.min)*(this.outputRange.max-this.outputRange.min)/(this.inputRange.max-this.inputRange.min);
      }
      value *= sign;
      value = s.util.clamp(value, -1, 1);
      return value;
  },

  handleTouches: function(evt) {
    // Stop scrolling
    evt.preventDefault();

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

      var joyWidth = this.joyWidth;
      var joyOffset = this.joyOffset;
      var joyDeadZone = this.joyDeadZone;

      var yCenter = this.yCenter;
      var xCenterLeft = this.xCenterLeft;
      var xCenterRight = this.xCenterRight;

      // Fire if Y is in top of screen
      if (y < this.height/2) {
        this.fire = true;
      }

      if (x > 0 && x < joyOffset * 2 + joyWidth && y > this.height - joyOffset * 2 - joyWidth && y < this.height) {
        var leftXInDeadZone = Math.abs(xCenterLeft - x) <= joyDeadZone;
        var leftYInDeadZone = Math.abs(yCenter - y) <= joyDeadZone;
        if (!leftXInDeadZone) {
          this.leftStick.x = this.rescaleJoyTouch((x - xCenterLeft) / (joyWidth / 2));
        }
        if (!leftYInDeadZone) {
          this.leftStick.y = this.rescaleJoyTouch((yCenter - y) / (joyWidth / 2));
        }
      }
      if (x > this.width - joyWidth - joyOffset * 2 && x < this.width && y > this.height - joyOffset * 2 - joyWidth && y < this.height) {
        var rightXInDeadZone = Math.abs(xCenterRight - x) <= joyDeadZone;
        var rightYInDeadZone = Math.abs(yCenter - y) <= joyDeadZone;
        if (!rightXInDeadZone) {
          this.rightStick.x = this.rescaleJoyTouch((x - xCenterRight) / (joyWidth / 2));
        }
        if (!rightYInDeadZone) {
          this.rightStick.y = this.rescaleJoyTouch((yCenter - y) / (joyWidth / 2));
        }
      }
    }
  }
});

