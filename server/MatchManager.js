var Match = require('./Match');

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

    var match = matchManager.getMatch(matchName);

    // @todo don't allow joining full matches etc
    player.socket.join(matchName);
    player.matchName = matchName;

    // Send list of players and states
    match.players.forEach(function(otherPlayer) {
      player.socket.emit('join', {
        name: otherPlayer.name,
        id: otherPlayer.socket.id
      });

      player.socket.emit('state', otherPlayer.get());
    });

    // Notify that player has joined
    player.socket.broadcast.to(player.matchName).emit('join', { name: player.name, id: player.socket.id });

    // Join the match
    match.join(player);

    return true;
  },

  leave: function(player) {
    if (!player.matchName) {
      console.error('Player %s tried to leave a match before joining one', player);
      return false;
    }

    // Notify that player has left
    player.socket.broadcast.to(player.matchName).emit('leave', { name: player.name, id: player.socket.id });

    var match = matchManager.getMatch(player.matchName);
    player.socket.leave(player.matchName);
    player.matchName = null;

    // Leave the match
    match.leave(player);

    // End the match if everyone left
    if (match.players.length === 0) {
      matchManager.endMatch[player.matchName];
    }

    return true;
  }
};