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
s.HUD.directionalIndicatorHeight = 23;

// The angular offset for the two sides of the directional indicator
s.HUD.directionalIndicatorAngularWidth = Math.PI/24;

s.HUD.friendlyIndicatorColor = 'rgba(0, 255, 0, 0.75)';
s.HUD.enemyIndicatorColor = 'rgba(255, 143, 0, 0.75)';
s.HUD.indicatorStroke = 'rgba(0, 0, 0, 0.5)';

s.HUD.targetColor = 'rgba(255, 0, 0, 0.5)';

// The radius of the circle around which directional indicators should be drawn
s.HUD.radius = 150;

// The size of the target square relative to distance
s.HUD.squareSizeFactor = 0.02;

s.HUD.prototype.update = function() {
  // Clear canvas
  this.ctx.clearRect(0, 0, this.width, this.height);

  this.drawTarget(s.game.spaceStation.name, s.game.spaceStation.root, s.HUD.friendlyIndicatorColor, 34, 5500);

  this.drawTarget(s.game.moonBase1.name, s.game.moonBase1.root, s.HUD.enemyIndicatorColor, 34, 5500);

  // Draw enemies
  for (var id in this.game.client.players) {
    var otherPlayer = this.game.client.players[id];
    // Since we set players to null when they leave, check if it's truthy
    if (otherPlayer) {
      this.drawTarget(otherPlayer.name, otherPlayer.ship.root, this.game.player.team === otherPlayer.ship.team ? s.HUD.friendlyIndicatorColor : s.HUD.enemyIndicatorColor, 34, 700);

      if (otherPlayer.isTargetted) {
        // @todo Don't hardcode the weapon class, get it from the player
        this.drawLeadIndicator(s.game.player.root, otherPlayer.ship.root, s.Weapon.Plasma);
      }
    }
  }
};

s.HUD.prototype.writeName = function(name, position, fillColor, textOffset) {
  this.ctx.fillStyle = fillColor;
  // @todo correctly center text
  this.ctx.font = 'bold 14px Andale Mono';
  var width = this.ctx.measureText(name).width;
  this.ctx.fillText(name, position.x - width / 2, position.y + textOffset);
};

s.HUD.prototype.fitWindow = function() {
  this.width = this.canvas.width = window.innerWidth;
  this.height = this.canvas.height = window.innerHeight;
  this.centerX = this.width / 2;
  this.centerY = this.height / 2;
};

s.HUD.prototype.drawTarget = function(name, targetMesh, fillColor, distanceFromRadius, minBoxDistance) {
  var targetMeshInSight;
  var distanceToTargetMesh;
  var squareSize;

  // Get the 2D position in NDC (Normalized Device Coordinates) of the target
  var targetMeshNDC = s.projector.projectVector(targetMesh.position.clone(), s.game.camera);

  if (Math.abs(targetMeshNDC.x) <= 0.95 && Math.abs(targetMeshNDC.y) <= 0.95 && targetMeshNDC.z < 1) {
    targetMeshInSight = true;
    distanceToTargetMesh = this.game.player.root.position.distanceTo(targetMesh.position);
    squareSize = Math.round((this.width - distanceToTargetMesh/100)*s.HUD.squareSizeFactor);
  }

  // targetMesh targeting reticle and targeting box
  if (!targetMeshInSight) {
    var targetMesh2D = new THREE.Vector2(targetMeshNDC.x, targetMeshNDC.y);
    targetMesh2D.multiplyScalar(1/targetMesh2D.length()).multiplyScalar(s.HUD.radius+distanceFromRadius);

    var directionalIndicatorCenterX = targetMesh2D.x+this.centerX
    var directionalIndicatorCenterY = -(targetMesh2D.y-this.centerY);
    // Calculate angle away from center
    var directionalIndicatorAngle = Math.atan2(directionalIndicatorCenterY-this.centerY, directionalIndicatorCenterX-this.centerX)

    var targetIsBehindUs = targetMeshNDC.z > 1;
    if (this.game.player.viewMode === 'front') {
      targetIsBehindUs = !targetIsBehindUs;
      directionalIndicatorAngle += Math.PI;
    }

    if (targetIsBehindUs) {
      var contextRotation = directionalIndicatorAngle + Math.PI/2;
      // Target is behind us
      this.ctx.beginPath();

      // Move to center
      this.ctx.translate(this.centerX, this.centerY);

      // Rotate around axis
      this.ctx.rotate(contextRotation);

      // Draw half circle
      this.ctx.arc(0, s.HUD.radius, 10, 0, Math.PI, false);
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = s.HUD.indicatorStroke;

      this.ctx.stroke();

      // Move back
      this.ctx.rotate(-contextRotation);
      this.ctx.translate(-this.centerX, -this.centerY);
    }
    else {
      // Target is in front of us
      this.ctx.beginPath();

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
  if (targetMeshInSight && distanceToTargetMesh > minBoxDistance) {
    var targetSquarePosition = targetMeshNDC.clone();
    targetSquarePosition.x =  (this.width  + targetSquarePosition.x*this.width )/2;
    targetSquarePosition.y = -(-this.height + targetSquarePosition.y*this.height)/2;

    this.ctx.strokeStyle = fillColor;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(targetSquarePosition.x-squareSize, targetSquarePosition.y-squareSize, squareSize*2, squareSize*2);

    if (name) {
      var textOffset = squareSize * 2;
      this.writeName(name, targetSquarePosition, fillColor, textOffset);
    }
    else {
      console.warn('s.HUD: Name not defined for mesh');
    }
  }
};

s.HUD.prototype.drawLeadIndicator = function(sourceInstance, targetInstance, ProjectileClass) {
  var sourceMesh = sourceInstance.root;
  var sourceBody = sourceInstance.body;
  var targetMesh = targetInstance.root;
  var targetBody = targetInstance.body;

  // Get position/velocity vectors as THREE.Vector3 so we can use the associated math functions
  var sourceVelocity = new THREE.Vector3().copy(sourceBody.velocity);
  var targetVelocity = new THREE.Vector3().copy(targetBody.velocity);
  var sourcePosition = new THREE.Vector3().copy(sourceInstance.body.position);
  var targetPosition = new THREE.Vector3().copy(targetInstance.body.position);

  /*
    Equation:
      Given the target's current position and velocity, calculate where it will be when the projectile arrives
      Then, calculate the heading to that location
      Then, draw a reticle indicating that the ship needs to be pointed there
  */
};
