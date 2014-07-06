var Match = require('./Match');

var players = [];
var matches = {};

var matchManager = module.exports = {
  getMatch: function(matchName) {
    var match = matches[matchName];
    if (!match) {
      console.log('Starting match %s', matchName);
      match = matches[matchName] = new Match({ name: matchName });
    }
    return match;
  },

  endMatch: function(matchName) {
    if (matches[matchName]) {
      console.log('Ending match %s', matchName);

      matches[matchName].end();

      matches[matchName] = null;
    }
    else {
      console.error('Tried to end match %s, but it didn\'t exist', matchName);
    }
  },

  join: function(matchName, player) {
    if (player.matchName) {
      console.warn('Player %s tried to join match %s before leaving existing match %s', player, matchName, player.matchName);

      matchManager.leave(player)
    }
    // @todo don't allow joining full matches etc
    matchManager.getMatch(matchName).join(player);
    player.socket.join(player.matchName);
    player.matchName = matchName;

    return true;
  },

  leave: function(player) {
    if (!player.matchName) {
      console.error('Player %s tried to leave a match before joining one', player);
      return false;
    }

    var match = matchManager.getMatch(player.matchName);
    match.leave(player);
    player.socket.leave(player.matchName);
    player.matchName = null;

    if (match.players.length === 0) {
      matchManager.endMatch[player.matchName];
    }

    return true;
  }
};