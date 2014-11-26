s.ShipChooser = function(options) {
  s.EventEmitter.call(this);

  var self = this;

  this.game = options.game;

  this.keyboard = new s.Keyboard();

  this.curTeamIndex = 0;
  this.curShipIndex = 0;

  this.update = this.update.bind(this);

  // Store teams
  this.teams = [];

  // Create a group and add it to the camera
  var root = this.root = new THREE.Group();
  this.root.position.z = -220;
  this.game.camera.add(this.root);

  // Add each ship
  var x = 0;
  var y = 0;
  var shipDistance = this.shipDistance;
  var teamDistance = this.teamDistance;
  for (var team in s.ships) {
    var teamModels = s.ships[team];
    var teamShips = [];
    teamShips.name = team;
    this.teams.push(teamShips);
    y = 0;

    for (var i = 0; i < teamModels.length; i++) {
      var shipClass = teamModels[i];

      var geometry = s.models[team+'_ship_'+shipClass].geometry;
      this.materials = s.models[team+'_ship_'+shipClass].materials[0];

      // Be very lit up by default
      this.materials.emissive = new THREE.Color(0xAAAAAA);
      this.materials.transparent = true;

      var shipRoot = new THREE.Mesh(geometry, this.materials);
      shipRoot.position.x = x;
      shipRoot.position.y = y;
      shipRoot.rotation.x = Math.PI/16;
      this.root.add(shipRoot);

      teamShips.push(shipRoot);

      shipRoot.team = team;
      shipRoot.cls = shipClass;

      y -= shipDistance;
    }
    x += teamDistance;
  }

  this.tween = new TWEEN.Tween({ x: 0, y: 0 })
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
       root.position.x = this.x;
       root.position.y = this.y;

       // Fade opacity
       for (var i = 0; i < self.teams.length; i++) {
        var teamShips = self.teams[i];
        for (var j = 0; j < teamShips.length; j++) {
          var otherShip = teamShips[j];
          var opacity = 1 - (root.position.z + root.position.clone().negate().sub(otherShip.position).length())/self.shipDistance*1.5;
          otherShip.material.opacity = opacity;
        }
      }
    });

  this.game.hook(this.update);
  this.positionGroup();
};

s.ShipChooser.prototype = Object.create(s.EventEmitter.prototype);
s.ShipChooser.prototype.constructor = s.ShipChooser;

s.ShipChooser.prototype.rotateSpeed = 0.2;
s.ShipChooser.prototype.shipDistance = 75;
s.ShipChooser.prototype.teamDistance = 150;

s.ShipChooser.prototype.destruct = function() {
  this.game.unhook(this.update);
  this.game.camera.remove(this.root);
  this.keyboard.destruct();
};

s.ShipChooser.prototype.previousTeam = function() {
  if (this.curTeamIndex > 0) {
    this.curTeamIndex--;
    this.positionGroup();
  }
};

s.ShipChooser.prototype.nextTeam = function() {
  if (this.curTeamIndex < this.teams.length - 1) {
    this.curTeamIndex++;
    this.positionGroup();
  }
};

s.ShipChooser.prototype.previousShip = function() {
  if (this.curShipIndex > 0) {
    this.curShipIndex--;
    this.positionGroup();
  }
};

s.ShipChooser.prototype.nextShip = function() {
  if (this.curShipIndex < this.teams[this.curTeamIndex].length - 1) {
    this.curShipIndex++;
    this.positionGroup();
  }
};

s.ShipChooser.prototype.positionGroup = function() {
  var x = -1 * this.curTeamIndex * this.teamDistance;
  var y = this.curShipIndex * this.shipDistance;
  this.tween.to({ x: x, y: y }, 500).start();

  var curShip = this.curShip = this.teams[this.curTeamIndex][this.curShipIndex];
};

s.ShipChooser.prototype.update = function(time, diff) {
  if (this.keyboard.pressed('left')) {
    this.previousTeam();
  }
  else if (this.keyboard.pressed('right')) {
    this.nextTeam();
  }
  else if (this.keyboard.pressed('up')) {
    this.previousShip();
  }
  else if (this.keyboard.pressed('down')) {
    this.nextShip();
  }
  else if (this.keyboard.pressed('space') || this.keyboard.pressed('enter')) {
    if (!this.shipSelected) {
      this.shipSelected = true;
      this.trigger('shipSelected', {
        team: this.curShip.team,
        cls: this.curShip.cls,
      });
    }
  }

  // Rotate ships
  var angleChange = this.rotateSpeed * diff * 2 * Math.PI / 1000;
  for (var i = 0; i < this.teams.length; i++) {
    var teamShips = this.teams[i];
    for (var j = 0; j < teamShips.length; j++) {
      var ship = teamShips[j];
      ship.rotation.y += angleChange;
    }
  }
};
