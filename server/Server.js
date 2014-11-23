var Match = require('./Match');
var Player = require('./Player');

// A map of IDs to Match instances
var matches = {};

function endMatch(match) {
  delete matches[match.id];
}

function createMatch(data) {
  var match = new Match({
    io: io,
    id: data.id,
    name: data.name,
    type: data.type,
    mapName: data.map,
    endWhenEmpty: data.endWhenEmpty
  });

  // Listen for end
  match.on('end', endMatch);

  // Store reference
  matches[match.id] = match;

  // Start the match
  match.start();

  return match;
}

function startMatch(player, data) {
  var match = createMatch(data);

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

  // Set name as provided
  player.name = data.name;

  if (match) {
    match.join(player);
  }
  else {
    var message = 'Match does not exist';
    console.error('Could not join match %s: %s', data.matchId, message);

    player.socket.emit('joinError', {
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

var io;
module.exports = function(_io) {
  // Store a reference to Socket.io
  io = _io;

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

    socket.on('disconnect', handleLeaveMatch.bind(null, player));
  });

  // Create the default match
  createMatch({
    id: 'default',
    name: 'Default Match',
    map: 'invasion',
    type: 'invasion',
    endWhenEmpty: false
  });
};
