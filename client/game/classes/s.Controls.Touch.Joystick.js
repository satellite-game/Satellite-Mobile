s.Controls.Touch.Joystick = function(options) {
  if (!options.position) {
    // throw new Error('s.Controls.Touch.Joystick: You must provide options.position');
    console.warn('s.Controls.Touch.Joystick: options.position not passed during construction');
  }

  this.update = this.update.bind(this);

  // Current joystick position
  this.x = 0;
  this.y = 0;

  this.el = document.createElement('div');
  this.el.className = 's-Joystick';
  document.body.appendChild(this.el);

  this.deadZoneEl = document.createElement('div');
  this.deadZoneEl.className = 's-Joystick-deadZone';
  this.el.appendChild(this.deadZoneEl);

  // Initial configuration
  this.configure(options || {});
};

s.Controls.Touch.Joystick.prototype.rescaleJoyTouch = function(value) {
  var sign = value/Math.abs(value);
  value = Math.abs(value);
  if (value > this.inputRange.min && value < this.inputRange.max) {
    value = (value - this.inputRange.min)*(this.outputRange.max-this.outputRange.min)/(this.inputRange.max-this.inputRange.min);
  }
  value *= sign;
  value = s.util.clamp(value, -1, 1);
  return value;
};

s.Controls.Touch.Joystick.prototype.configure = function(options) {
  // User provided
  // Use existing values if not provided
  this.position = options.position || this.position;
  this.width = options.width || this.width || 240;
  this.deadZone = options.deadZone || this.deadZone || this.width * 0.10; // 10% of width
  this.margin = options.margin || this.margin || this.width * 0.15; // 15% of width

  // Calculated
  this.inputRange = { min: this.deadZone / this.width * 2, max: 1.0};
  this.outputRange = { min: 0.0, max: 1.0};

  if (this.position) {
    this.el.style.left = this.position.x + 'px';
    this.el.style.top = this.position.y + 'px';
  }

  this.el.style.width = this.width + 'px';
  this.el.style.height = this.width + 'px';
  this.el.style.marginLeft = -this.width/2 + 'px';
  this.el.style.marginTop = -this.width/2 + 'px';

  this.deadZoneEl.style.width = this.deadZone + 'px';
  this.deadZoneEl.style.height = this.deadZone + 'px';
  this.deadZoneEl.style.marginLeft = -this.deadZone/2 + 'px';
  this.deadZoneEl.style.marginTop = -this.deadZone/2 + 'px';
};

s.Controls.Touch.Joystick.prototype.reset = function() {
  this.x = 0;
  this.y = 0;
};

s.Controls.Touch.Joystick.prototype.update = function(touch) {
  var x = touch.clientX;
  var y = touch.clientY;

  var xMin = this.position.x - this.width / 2 - this.margin;
  var xMax = this.position.x + this.width / 2 + this.margin;

  var yMin = this.position.y - this.width / 2 - this.margin;
  var yMax = this.position.y + this.width / 2 + this.margin;

  var radius = (this.width / 2);

  if (x > xMin && x < xMax && y > yMin && y < yMax) {
    var leftXInDeadZone = Math.abs(this.position.x - x) <= this.deadZone/2;
    var leftYInDeadZone = Math.abs(this.position.y - y) <= this.deadZone/2;

    if (!leftXInDeadZone) {
      this.x = this.rescaleJoyTouch((x - this.position.x) / radius);
    }

    if (!leftYInDeadZone) {
      this.y = this.rescaleJoyTouch((this.position.y - y) / radius);
    }
  }
};
