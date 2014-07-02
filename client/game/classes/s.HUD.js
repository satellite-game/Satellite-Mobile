s.HUD = function(options) {
  this.game = options.game;

  // Add crosshairs
  this.crosshairs = new THREE.Sprite(new THREE.SpriteMaterial({
    map: s.textures.crosshairs,
    useScreenCoordinates: false,
    blending: THREE.AdditiveBlending,
    color: 0x00FF00
  }));

  this.game.camera.add(this.crosshairs);
  this.crosshairs.position.setZ(-30);

  // Create canvas
  this.canvas = document.createElement('canvas');

  this.width = this.canvas.width = window.innerWidth;
  this.height = this.canvas.height = window.innerHeight;

  this.canvas.style.position = 'absolute';
  this.canvas.style.top = 0;
  this.canvas.style.left = 0;

  this.ctx = this.canvas.getContext('2d');
  document.body.appendChild(this.canvas);

  // Update on tick
  this.update = this.update.bind(this);
  this.game.hook(this.update);

  // Set size when window size changed
  this.fitWindow = this.fitWindow.bind(this);
  $(window).on('resize', this.fitWindow);
  this.fitWindow();
};

s.HUD.baseColor = 'rgba(0, 255, 0, 0.5)';

// The height of the directional indicator (away from the circumference of the circle)
s.HUD.directionalIndicatorHeight = 20;

// The angular offset for the two sides of the directional indicator
s.HUD.directionalIndicatorAngularWidth = Math.PI/32;

s.HUD.friendlyIndicatorColor = 'rgba(0, 255, 0, 0.75)';
s.HUD.enemyIndicatorColor = 'rgba(255, 143, 0, 0.75)';
s.HUD.indicatorStroke = 'rgba(0, 0, 0, 0.5)';

s.HUD.targetColor = 'rgba(255, 0, 0, 0.5)';

// The radius of the circle around which directional circles should be drawn
s.HUD.radius = 200;

// The size of the target square relative to distance
s.HUD.squareSizeFactor = 0.02;

s.HUD.prototype.update = function() {
  // Clear canvas
  this.ctx.clearRect(0, 0, this.width, this.height);

  this.drawTarget(s.game.spaceStation.root, s.HUD.friendlyIndicatorColor, 34, 5500);

  this.drawTarget(s.game.moonBase1.root, s.HUD.enemyIndicatorColor, 34, 5500);
};

s.HUD.prototype.writeName = function(name, clone, fillColor) {
  this.ctx.fillStyle = fillColor;
  // @todo correctly center text
  this.ctx.fillText(name, clone.x-40, clone.y+35);
};

s.HUD.prototype.fitWindow = function() {
  this.width = this.canvas.width = window.innerWidth;
  this.height = this.canvas.height = window.innerHeight;
  this.centerX = this.width / 2;
  this.centerY = this.height / 2;
};

s.HUD.prototype.drawTarget = function(circleTarget, fillColor, distanceFromRadius, maxBoxDistance) {
  var circleTargetInSight;
  var distanceToCircleTarget;
  var v2DcircleTarget;
  var squareSize;

  var vcircleTarget3D = circleTarget.position.clone();
  var vcircleTarget2D = s.projector.projectVector(vcircleTarget3D, s.game.camera);

  if (Math.abs(vcircleTarget2D.x) <= 0.95 && Math.abs(vcircleTarget2D.y) <= 0.95 && vcircleTarget2D.z < 1) {
    circleTargetInSight = true;
    distanceToCircleTarget = this.game.player.root.position.distanceTo(circleTarget.position);
    squareSize = Math.round((this.width - distanceToCircleTarget/100)*s.HUD.squareSizeFactor);
  }

  // circleTarget targeting reticle and targeting box
  if (!circleTargetInSight) {
    var circleTarget2D = new THREE.Vector2(vcircleTarget2D.x, vcircleTarget2D.y);
    circleTarget2D.multiplyScalar(1/circleTarget2D.length()).multiplyScalar(s.HUD.radius+distanceFromRadius);

    if (vcircleTarget2D.z > 1) {
      // Target is behind us
      // Things get ugly so do nothing
      // this.ctx.arc(-circleTarget2D.x+this.centerX, (-circleTarget2D.y+this.centerY), 10, 0, 2*Math.PI, false);
    }
    else {
      // Target is in front of us
      this.ctx.beginPath();
      var directionalIndicatorCenterX = circleTarget2D.x+this.centerX
      var directionalIndicatorCenterY = -(circleTarget2D.y-this.centerY);

      // Calculate angle away from center
      var directionalIndicatorAngle = Math.atan2(directionalIndicatorCenterY-this.centerY, directionalIndicatorCenterX-this.centerX)

      // Calculate the tip of the triangle
      var directionalIndicatorTopX = this.centerX + (s.HUD.radius + s.HUD.directionalIndicatorHeight) * Math.cos(directionalIndicatorAngle);
      var directionalIndicatorTopY = this.centerY + (s.HUD.radius + s.HUD.directionalIndicatorHeight) * Math.sin(directionalIndicatorAngle);

      // Calculate the first vertex of the triangle, on the circumference
      var directionalIndicatorSide1X = this.centerX + s.HUD.radius * Math.cos(directionalIndicatorAngle + s.HUD.directionalIndicatorAngularWidth);
      var directionalIndicatorSide1Y = this.centerY + s.HUD.radius * Math.sin(directionalIndicatorAngle + s.HUD.directionalIndicatorAngularWidth);

      // Calculate the divot in the triangle, between the circumference and the tip
      var directionalIndicatorDivotX = this.centerX + (s.HUD.radius + s.HUD.directionalIndicatorHeight/2) * Math.cos(directionalIndicatorAngle);
      var directionalIndicatorDivotY = this.centerY + (s.HUD.radius + s.HUD.directionalIndicatorHeight/2) * Math.sin(directionalIndicatorAngle);

      // Calculate the second vertex of the triangle, on the circumference
      var directionalIndicatorSide2X = this.centerX + s.HUD.radius * Math.cos(directionalIndicatorAngle - s.HUD.directionalIndicatorAngularWidth);
      var directionalIndicatorSide2Y = this.centerY + s.HUD.radius * Math.sin(directionalIndicatorAngle - s.HUD.directionalIndicatorAngularWidth);

      // Move to tip
      this.ctx.moveTo(directionalIndicatorTopX, directionalIndicatorTopY);

      // Line to point 1
      this.ctx.lineTo(directionalIndicatorSide1X, directionalIndicatorSide1Y);

      // Line to divot
      this.ctx.lineTo(directionalIndicatorDivotX, directionalIndicatorDivotY);

      // Line to point 2
      this.ctx.lineTo(directionalIndicatorSide2X, directionalIndicatorSide2Y);

      // Line back to tip
      this.ctx.lineTo(directionalIndicatorTopX, directionalIndicatorTopY);

      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = s.HUD.indicatorStroke;
      this.ctx.stroke();
    }
  }

  // Draw square around object
  if (circleTargetInSight && distanceToCircleTarget > maxBoxDistance) {
    v2DcircleTarget = vcircleTarget2D.clone();
    v2DcircleTarget.x =  (this.width  + v2DcircleTarget.x*this.width )/2;
    v2DcircleTarget.y = -(-this.height + v2DcircleTarget.y*this.height)/2;

    this.ctx.strokeStyle = fillColor;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(v2DcircleTarget.x-squareSize, v2DcircleTarget.y-squareSize, squareSize*2, squareSize*2);

    if (circleTarget.name) {
      this.writeName(circleTarget.name, v2DcircleTarget, fillColor);
    }
    else {
      throw new Error('s.HUD: Name not defined for mesh');
    }
  }
};
