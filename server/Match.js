/*
  Manage game logic
  Maintain a list of players and their positions
  Mainatin game state and broadcast changes
*/

function Match(options) {
  this.name = options.name;

  // @todo support different maps
  // this.map = options.map;

  this.players = [];
}

Match.prototype.start = function() {
  // Hook into loop
  // Emit start event
  // Stop when time is up
};

Match.prototype.end = function() {
  // Unhook
  // Emit end event
};

Match.prototype.calculateScore = function() {
  // Loop through players, tally up score based on team
};

Match.prototype.join = function(player) {
  // Send map

  // Broadcast join and initial position

  // Add event listeners

  // Store player
  var index = this.players.indexOf(player);
  if (index !== -1) {
    console.error('Player %s tried to join %s twice', player, this.name);
  }
  this.players.push(player);

  console.log('%s has joined %s', player.name, this.name);
};

Match.prototype.leave = function(player) {
  // Send map
  
  // Broadcast leave

  // Remove player
  var index = this.players.indexOf(player);
  if (index === -1) {
    throw new Error('Requested to remove player from match, but player wasn\'t present!');
  }
  this.players.splice(index, 1);

  console.log('%s has left %s', player.name, this.name);
};

module.exports = Match;
