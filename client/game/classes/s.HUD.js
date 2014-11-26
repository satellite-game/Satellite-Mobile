s.HUD = function(options) {
  this.game = options.game;
  this.client = options.client;
  this.player = options.player;

  // Add crosshairs
  this.crosshairs = new THREE.Sprite(new THREE.SpriteMaterial({
    map: s.textures.crosshairs,
    useScreenCoordinates: false,
    blending: THREE.AdditiveBlending,
    color: 0x00FF00
  }));

  this.hudItems = new THREE.Group();
  this.game.camera.add(this.hudItems);

  this.hudItems.add(this.crosshairs);
  this.crosshairs.position.setZ(-30);

  // Update on tick
  this.update = this.update.bind(this);
  this.game.hook(this.update);

  var planeGeo = new THREE.PlaneBufferGeometry(250, 250);
  var planeMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('green'),
    transparent: true,
    opacity: 0
  });

  this.hudPlane = new THREE.Mesh(planeGeo, planeMat);
  this.hudPlane.visible = false;
  this.hudPlane.position.z = -100;

  this.game.camera.add(this.hudPlane);
};

s.HUD.baseColor = new THREE.Color('rgb(0, 180, 0)');
s.HUD.friendlyIndicatorColor = new THREE.Color('rgb(0, 180, 0)');
s.HUD.enemyIndicatorColor = new THREE.Color('rgb(255, 143, 0)');
s.HUD.targetColor = new THREE.Color('rgb(180, 0, 0)');

// The radius of the circle around which directional indicators should be drawn
s.HUD.radius = 150;

// The size of the target square relative to distance
s.HUD.squareSizeFactor = 0.02;

s.HUD.arrowGeometry = new THREE.CylinderGeometry(0, 1, 2, 4, false);

s.HUD.enemyIndicatorMaterial = new THREE.MeshBasicMaterial({
  color: s.HUD.enemyIndicatorColor
});

s.HUD.friendlyIndicatorMaterial = new THREE.MeshBasicMaterial({
  color: s.HUD.friendlyIndicatorColor
});

s.HUD.prototype.hide = function() {
  this.hudItems.visible = false;
};

s.HUD.prototype.show = function() {
  this.hudItems.visible = true;
};

s.HUD.prototype.getMaterial = function(item) {
  return this.player.team === item.team ? s.HUD.friendlyIndicatorMaterial : s.HUD.enemyIndicatorMaterial;
};

s.HUD.prototype.getColor = function(item) {
  return this.player.team === item.team ? s.HUD.friendlyIndicatorColor : s.HUD.enemyIndicatorColor;
};

s.HUD.prototype.update = function() {
  // The HUD may be called before the player is created
  // In that case, do nothing
  if (!this.player || !this.player.ship) {
    return;
  }

  var items = this.game.map.items;
  for (var id in items) {
    var item = items[id];

    if (!item || item.hp <= 0 || item.team === 'unaffiliated') {
      // Skip unaffiliated or dead items
      continue;
    }

    // @todo don't hardcode distance/minBoxDistance
    this.drawTarget(item.name, item.root, this.getColor(item), 34, 5500);
  }

  // Draw enemies
  for (var id in this.client.players) {
    var otherPlayer = this.client.players[id];
    // Since we set players to null when they leave, check if it's truthy
    if (otherPlayer && otherPlayer.ship) {
      this.drawTarget(otherPlayer.name, otherPlayer.ship.root, this.getColor(otherPlayer.ship), 34, 700);

      if (otherPlayer.isTargetted) {
        // @todo Don't hardcode the weapon class, get it from the player
        this.drawLeadIndicator(s.game.player.root, otherPlayer.ship.root, s.Weapon.Plasma);
      }
    }
  }
};

s.HUD.prototype.createBox = function(targetMesh) {
  // @todo cache material?
  var material = new THREE.LineBasicMaterial({
    color: this.getColor(targetMesh)
  });

  // Create the box mesh
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(-1,  0,  0));
  geometry.vertices.push(new THREE.Vector3( 0,  1,  0));
  geometry.vertices.push(new THREE.Vector3( 1,  0,  0));
  geometry.vertices.push(new THREE.Vector3( 0, -1,  0));
  geometry.vertices.push(new THREE.Vector3(-1,  0,  0));

  var line = new THREE.Line(geometry, material);
  line.position.z = this.hudPlane.position.z;
  this.game.camera.add(line);

  targetMesh.box = line;

  return line;
};

s.HUD.prototype.createArrow = function(targetMesh) {
  // Create the arrow mesh
  var arrow = new THREE.Mesh(s.HUD.arrowGeometry, this.getMaterial(targetMesh));
  arrow.position.set(0, 10, 0);

  // Create the pivot plane
  var pivot = new THREE.Object3D();
  pivot.position.z = -100;
  pivot.add(arrow)

  this.hudItems.add(pivot);

  var arrowInfo = {
    pivot: pivot,
    arrow: arrow
  };

  // Store on the mesh
  targetMesh.arrow = arrowInfo;

  return arrowInfo;
};

s.HUD.prototype.drawTarget = function(name, targetMesh, fillColor, distanceFromRadius, minBoxDistance) {
  // Get an arrow
  var arrow = targetMesh.arrow || this.createArrow(targetMesh);

  // Set arrow color
  arrow.arrow.material.color = fillColor;

  var targetMeshInSight;
  var distanceToTargetMesh;
  var squareSize;

  // Get the 2D position in NDC (Normalized Device Coordinates) of the target
  var targetMeshNDC = targetMesh.position.clone().project(s.game.camera);

  if (Math.abs(targetMeshNDC.x) <= 0.95 && Math.abs(targetMeshNDC.y) <= 0.95 && targetMeshNDC.z < 1) {
    targetMeshInSight = true;
    distanceToTargetMesh = this.player.ship.root.position.distanceTo(targetMesh.position);
    squareSize = Math.round((this.width - distanceToTargetMesh/100)*s.HUD.squareSizeFactor);
  }

  // targetMesh targeting reticle and targeting box
  if (targetMeshInSight) {
    arrow.arrow.visible = false;
  }
  else {
    arrow.arrow.visible = true;

    // Calculate angle away from center
    var directionalIndicatorAngle = Math.atan2(-targetMeshNDC.y, -targetMeshNDC.x)

    var targetIsBehindUs = targetMeshNDC.z > 1;

    // Rotate the angle if the target is behind us
    if (targetIsBehindUs) {
      directionalIndicatorAngle += Math.PI;
    }

    // Rotate the arrow to point
    arrow.pivot.rotation.z = directionalIndicatorAngle + Math.PI/2;
  }

  // "2D box"
  var box = targetMesh.box || this.createBox(targetMesh);

  // Draw square around object in 3D
  if (targetMeshInSight && distanceToTargetMesh > minBoxDistance) {
    box.visible = true;

    var camera = this.game.camera;

    // Make sure matricies are up to date
    // Without this, target reticles will lag behind
    // @tod this doesn't seem to work
    camera.parent.updateMatrixWorld();
    targetMesh.updateMatrixWorld();

    // Get the camera position in world coordinates
    var cameraPosition = camera.parent.localToWorld(camera.position.clone());
    var targetPosition = targetMesh.position.clone();

    // Cast a ray from the camera to the target
    var raycaster = new THREE.Raycaster(cameraPosition, targetPosition.sub(cameraPosition).normalize());
    var intersects = raycaster.intersectObject(this.hudPlane, true);

    if (intersects.length) {
      // Calculate the distance
      var distance = this.player.ship.root.position.distanceTo(targetMesh.position);
      var distanceFactor = 12000/distance;

      var intersection = intersects[0];

      // Get the position of the intersection in local coordinates
      var intersectionVector = intersection.point.clone();
      intersection.object.worldToLocal(intersectionVector);

      // Move the box accordingly
      box.position.x = intersectionVector.x;
      box.position.y = intersectionVector.y;
      box.scale.set(distanceFactor, distanceFactor, distanceFactor);
    }
  }
  else {
    box.visible = false;
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
