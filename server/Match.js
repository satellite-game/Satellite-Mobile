var shortId = require('shortid');
var Maps = require('./maps');
var EventEmitter = require('events').EventEmitter;

/*
  Manage game logic
  Maintain a list of players and their positions
  Mainatin game state and broadcast changes
*/
function Match(options) {
  this.io = options.io;
  this.name = options.name;
  this.id = options.id || shortId.generate();

  this.endWhenEmpty = typeof options.endWhenEmpty === 'boolean' ? options.endWhenEmpty : true;

  // @todo support different game types
  this.type = options.type;

  this.mapName = options.mapName;

  this.players = [];
}

Match.prototype = Object.create(EventEmitter.prototype);

Match.prototype.start = function() {
  // @todo Hook into loop
  // @todo Stop when time is up

  // Load the map
  this.loadMap(this.mapName);

  // Emit start event
  this.emit('start', this);
};

Match.prototype.end = function() {
  // @todo Unhook from loop

  // Emit end event
  this.emit('end', this);
};

Match.prototype.restart = function() {
  this.emit('restart', this);

  this.start();
};

Match.prototype.loadMap = function(mapName) {
  var map = Maps[mapName];

  if (!map) {
    console.error('Map %s not found', mapName);
    return;
  }

  // Copy the map
  this.map = JSON.parse(JSON.stringify(map));

  // Send map
  this.io.to(this.id).emit('map', this.map);
};

Match.prototype.checkWinState = function() {
  var alienItemCount = 0;
  var humanItemCount = 0;

  var gameOver;
  var winReason = '';

  // Check if the moon was destroyed
  if (this.map.items.Moon.hp <= 0) {
    winReason = 'Moon was destroyed.';
  }

  // Check for human or alien items
  var item;
  for (var itemName in this.map.items) {
    item = this.map.items[itemName];

    if (item.hp > 0) {
      if (item.team === 'human') {
        humanItemCount++;
      }
      else if (item.team === 'alien') {
        alienItemCount++;
      }
    }
  }

  // If no more items remain
  if (!alienItemCount) {
    winReason = 'Aliens were defeated.';
    gameOver = true;
  }
  else if (!humanItemCount) {
    winReason = 'Humans were defeated.';
    gameOver = true;
  }

  if (gameOver) {
    console.log('Game over: %s', winReason);

    this.io.to(this.id).emit('gameOver', {
      reason: winReason
    });

    this.restart();
  }
  else {
    console.log('%d human items remain', humanItemCount);
    console.log('%d alien items remain', alienItemCount);
  }
};

Match.prototype.handle = function(eventName, player, data) {
  if (!data) {
    data = {};
  }

  // Add ID to every packet
  data.id = player.id;

  if (eventName === 'weaponHit') {
    var targetId = data.targetId;

    // Find out if it's an item or a player
    var targetItem = this.map.items[targetId];
    var targetPlayer = this.getPlayer(targetId);
    if (targetItem) {
      if (!targetItem.hp) {
        return;
      }

      // @todo make an instance and give takeHit method
      targetItem.hp -= 10;
      if (targetItem.hp <= 0) {
        console.log('Item %s was destroyed', targetId);

        this.io.to(this.id).emit('itemDestroyed', {
          attackerId: targetItem.id,
          targetId: targetId
        });

        this.checkWinState();
      }
      else {
        console.log('Item %s was hit, hp is now %d', targetId, targetItem.hp);

        this.io.to(this.id).emit('itemHit', {
          attackerId: player.id,
          targetId: targetId,
          hp: targetItem.hp
        });
      }
    }
    else if (targetPlayer) {
      if (!targetPlayer.hp) {
        return;
      }

      targetPlayer.takeHit(10, player.id);
      if (targetPlayer.hp <= 0) {
        console.log('Player %s was killed', targetPlayer);

        this.io.to(this.id).emit('playerDestroyed', {
          attackerId: player.id,
          targetId: targetId
        });

        // Respawn the player
        targetPlayer.respawn();

        this.checkWinState();
      }
      else {
        console.log('Player %s was hit, hp is now %d', targetPlayer, targetPlayer.hp);

        this.io.to(this.id).emit('playerHit', {
          attackerId: player.id,
          targetId: targetId,
          hp: targetPlayer.hp
        });
      }
    }
    else {
      console.error('Got hit on untracked entity '+targetId);
    }
  }
  else {
    // Re-broadcast to the entire match
    player.socket.broadcast.to(this.id).emit(eventName, data);
  }
};

Match.prototype.getPlayer = function(id) {
  // Store player
  var foundPlayer = null;
  this.players.some(function(player) {
    if (player.id === id) {
      foundPlayer = player;
      return true;
    }
  });

  return foundPlayer;
}

Match.prototype.join = function(player) {
  // Store player
  var index = this.players.indexOf(player);
  if (index !== -1) {
    console.error('Player %s tried to join match %s twice', player, this.id);
    return;
  }
  // Store the match
  player.match = this;

  // Join the room
  player.socket.join(this.id);

  // @todo Send map state
  player.socket.emit('map', this.map);

  // Send player list
  // @todo should this be sent as a list?
  this.players.forEach(function(otherPlayer) {
    player.socket.emit('joinMatch', otherPlayer.get('joinMatch'));

    player.socket.emit('joinTeam', otherPlayer.get('joinTeam'));

    player.socket.emit('state', otherPlayer.get('state'));
  });

  // Add to player list
  this.players.push(player);

  // Broadcast join that player has joined
  this.handle('joinMatch', player, {
    name: player.name
  });

  // Tell the player they have joined the match and give them their ID
  player.socket.emit('matchJoined', {
    id: player.id
  });

  console.log('Player %s has joined match %s', player, this.id);

  this.emit('playerJoined', this, player);
};

Match.prototype.leave = function(player) {
  // Leave the room
  player.socket.leave(this.id);

  player.match = null;

  // Remove player
  var index = this.players.indexOf(player);
  if (index === -1) {
    throw new Error('Requested to remove player from match, but player wasn\'t present!');
  }
  this.players.splice(index, 1);

  // Notify that player has left
  player.socket.broadcast.to(this.id).emit('leaveMatch', { id: player.id });

  console.log('Player %s has left match %s', player.id, this.id);

  this.emit('playerLeft', this, player);

  // End the match if everyone left
  if (this.endWhenEmpty && this.players.length === 0) {
    this.end();
  }
};

module.exports = Match;
