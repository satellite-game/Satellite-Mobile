s.Controls.Touch.Button = function(options) {
  if (!options.position) {
    // throw new Error('s.Controls.Touch.Button: You must provide options.position');
    console.warn('s.Controls.Touch.Button: options.position not passed during construction');
  }

  this.el = document.createElement('div');
  this.el.className = 's-Button';
  document.body.appendChild(this.el);

  this.update = this.update.bind(this);

  // Current Button position
  this.pressed = 0;

  // Initial configuration
  this.configure(options || {});
};

s.Controls.Touch.Button.prototype.configure = function(options) {
  // User provided
  // Use existing values if not provided
  this.position = options.position || this.position;
  this.width = options.width || this.width || 240;
  this.margin = options.margin || this.margin || this.width * 0.15; // 15% of width

  this.fill = options.fill || this.fill || 'transparent';
  this.color = options.color || this.color || 'green';
  this.text = options.text || this.text || '';

  if (this.position) {
    this.el.style.left = this.position.x + 'px';
    this.el.style.top = this.position.y + 'px';
  }

  this.el.style.width = this.width + 'px';
  this.el.style.height = this.width + 'px';

  this.el.style.marginLeft = -this.width/2 + 'px';
  this.el.style.marginTop = -this.width/2 + 'px';

  this.el.style.backgroundColor = this.fill;
  this.el.style.borderColor = this.color;
  this.el.style.color = this.color;
  this.el.style.lineHeight = this.width + 'px';
  this.el.textContent = this.text;
};

s.Controls.Touch.Button.prototype.reset = function() {
  this.pressed = false;
};

s.Controls.Touch.Button.prototype.update = function(touch) {
  var x = touch.clientX;
  var y = touch.clientY;

  var xMin = this.position.x - this.width / 2 - this.margin;
  var xMax = this.position.x + this.width / 2 + this.margin;

  var yMin = this.position.y - this.width / 2 - this.margin;
  var yMax = this.position.y + this.width / 2 + this.margin;

  var radius = (this.width / 2);

  if (x > xMin && x < xMax && y > yMin && y < yMax) {
    this.pressed = true;
  }
};
