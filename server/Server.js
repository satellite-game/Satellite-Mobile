var Match = require('./Match');

// A map of IDs to Match instances
var matches = {};

function endMatch(match) {
  delete matches[match.id];
}

function startMatch(player, data) {
  var match = new Match({
    name: data.name,
    type: data.type
  });

  match.on('end', endMatch);

  // Automatically join the match
  match.join(player);
}

function listMatches(player) {
  var matchList = [];

  for (var id in matches) {
    var match = matches[id];
    matchList.push({
      id: id,
      name: match.name,
      players: match.players.length,
      type: match.type
    })
  }

  player.socket.emit('matchList', matchList);
}

function joinMatch(player, data) {
  var match = matches[data.matchId];

  if (match) {
    match.join(player);
  }
  else {
    var message = 'Match does not exist';
    console.error('Could not join match %s: ', data.matchId);

    player.socket.emit('error', {
      message: 'Match '+data.match+' does not exist.'
    });
  }
}

function handleLeaveMatch(player) {
  if (!player.match) {
    console.warn('Player %s tried to leave match without joining.', player);
    return;
  }

  // Leave the match
  player.match.leave(player);
}

module.exports = function(io) {
  io.sockets.on('connection', function(socket) {
    var ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;;
    console.log('New connection from %s', ip);

    var player = new Player({
      socket: socket
    });

    // Add all listeners once
    socket.on('listMatches', listMatches.bind(null, player));

    socket.on('startMatch', startMatch.bind(null, player));
    socket.on('joinMatch', joinMatch.bind(null, player));
    socket.on('leaveMatch', handleLeaveMatch.bind(null, player));

    socket.on('disconnect', handleDisconnect.bind(null, player));
  });
};
