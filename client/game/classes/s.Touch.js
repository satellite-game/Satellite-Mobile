s.Touch = new Class({
  toString: 'Touch',

  _steerSize: 100,
  _deadZone: 0.15,

  construct: function(game, player) {
    var self = this;
    this.keyCodes = {};

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Listen to key events
    window.addEventListener('touchstart', this.handleTouchStart, false);
    window.addEventListener('touchmove', this.handleTouchMove, false);
    window.addEventListener('touchend', this.handleTouchEnd, false);

    this.x = 0;
    this.y = 0;
  },

  destruct: function() {
    window.removeEventListener('touchstart', this.handleTouchStart, false);
    window.removeEventListener('touchmove', this.handleTouchMove, false);
    window.removeEventListener('touchend', this.handleTouchEnd, false);
  },

  handleTouchStart: function(evt) {
    // Store start X/Y
    this._startX = evt.touches[0].screenX;
    this._startY = evt.touches[0].screenY;

    this.throttle = true;
  },

  handleTouchMove: function(evt) {
    evt.preventDefault();

    // Calculate delta
    var deltaX = s.util.clamp((this._startX/this._steerSize - evt.touches[0].screenX/this._steerSize), -1, 1)
    var deltaY = s.util.clamp((this._startY/this._steerSize - evt.touches[0].screenY/this._steerSize), -1, 1)

    // Store steer values
    if (Math.abs(deltaX) > this._deadZone) {
      this.x = deltaX;
    }
    else {
      this.x = 0;
    }

    if (Math.abs(deltaY) > this._deadZone) {
      this.y = deltaY;
    }
    else {
      this.y = 0;
    }
  },

  handleTouchEnd: function(evt) {
    // Clear steer values
    this.x = 0;
    this.y = 0;

    this.throttle = false;
  },
});

