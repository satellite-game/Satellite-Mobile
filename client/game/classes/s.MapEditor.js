s.MapEditor = function() {
  var game = s.game;

  // Create a pivot for placing things on the moon
  var pivot = new THREE.Object3D();
  s.game.scene.add(pivot);

  // A list of added map items
  var items = [];

  // The item we're currently placing / its team
  var currentItem = null;
  var currentTeam = 'human';

  // The rotation to add the next object at
  var currentRotation = 0;

  // List of objects we can add
  var currentObjectIndex = 0;
  var possibleObjects = [
    s.BuildingTall,
    s.BuildingShort
  ];

  // Info container
  var $info = $('<div style="position: absolute; z-index: 100; top: 0; right: 0; background: rgba(255, 255, 255, 0.5); color: black; font-family: monospace; padding: 10px;"></div>').appendTo(document.body);

  // Add initial object
  useObject(possibleObjects[currentObjectIndex]);

  // Add each object from the current map
  for (var name in s.game.map.items) {
    items.push(s.game.map.items[name]);
  }

  s.getMap = function() {
    var map = {
       // Use same spawn
      spawn: {
        human: {
          pos: s.Client.objToPacketItem(s.game.map.spawn.human.pos),
          rot: s.Client.objToPacketItem(s.game.map.spawn.human.rot)
        },
        alien: {
          pos: s.Client.objToPacketItem(s.game.map.spawn.alien.pos),
          rot: s.Client.objToPacketItem(s.game.map.spawn.alien.rot)
        }
      },
      items: {}
    };

    function getClassName(item) {
      return item.constructor.className;
    }

    function getBaseName(item) {
      return item.toString();
    }

    function getUniqueName(item) {
      var baseName = getBaseName(item);
      var name = baseName;
      var count = 1;
      while (map[name]) {
        name = baseName+' ('+(count++)+')';
      }
      return name;
    }

    items.forEach(function(item) {
      var name = getUniqueName(item);
      var position = item.root.position;
      var rotation = item.root.quaternion;
      map.items[name] = {
        team: item.team,
        cls: getClassName(item),
        hp: item.hp,
        pos: [position.x, position.y, position.z],
        rot: [rotation.x, rotation.y, rotation.z, rotation.w]
      };
    });

    return JSON.stringify(map, null, 2);
  }

  function setInfo() {
    $info.html('<strong>Item:</strong> '+currentItem.toString()+'<br><strong>Team:</strong> '+currentTeam);
  }

  function placeItem() {
    var item = currentItem;

    item.root.updateMatrixWorld();

    // Get world position
    var position = new THREE.Vector3();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();
    item.root.matrixWorld.decompose(position, quaternion, scale);

    // Add back to the scene
    s.game.scene.add(item.root);

    // Disable physics / loop
    s.game.world.add(item.body);
    s.game.hook(item.update);

    // Position accordingly
    item.setState(position, quaternion);

    // Add to list of items
    items.push(item);

    console.log('Placing %s at %d, %d, %d', item, position.x, position.y, position.z);

    // Don't blow it away when we use a new item
    currentItem = null;

    // Use the same item again
    useObject(item.constructor);

    return {
      position: position,
      rotation: quaternion
    };
  }

  function removeItem(item) {
    var index = items.indexOf(item);
    if (index !== -1) {
      items.splice(index, 1);
      item.destruct();

      // Take on the rotation of the item
      currentRotation = item.mapRotation || 0;

      // Immediately use the object so it can be placed again
      useObject(item.constructor);

      console.log('Removed %s', item);
    }
    else {
      console.error('Could not remove %s', item);
    }
  }

  function useObject(Type) {
    // Remove old item
    if (currentItem) {
      pivot.remove(currentItem.root);
      currentItem.destruct();
    }

    var item = new Type({ game: s.game });

    // Disable physics / loop
    s.game.world.remove(item.body);
    s.game.unhook(item.update);

    // Move to correct position / rotation
    item.setState(new THREE.Vector3(0, 0, s.Moon.prototype.radius - 20));

    // Rotate to point "up"
    item.root.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2);

    // Rotate to match last rotation
    item.root.rotateOnAxis(new THREE.Vector3(0, 1, 0), currentRotation);

    // Add to the moon pivot
    pivot.add(item.root);
    currentItem = item;
    currentObjectIndex = possibleObjects.indexOf(Type);

    setInfo();

    console.log('Current item set to %s', item);
  }

  function getPointOnMoon(event) {
    var mouseNDC = s.util.getNDC(event.pageX, event.pageY, window.innerWidth, window.innerHeight);

    var vector = new THREE.Vector3(mouseNDC.x, mouseNDC.y, 1);
    s.projector.unprojectVector(vector, game.camera);

    var cameraPos = game.player.ship.root.localToWorld(game.camera.position.clone());

    var ray = new THREE.Raycaster(cameraPos, vector.sub(cameraPos).normalize());

    var intersects = ray.intersectObjects([game.map.items.Moon.root]);

    if (intersects.length) {
      return intersects[0].point;
    }

    return null;
  }

  function getIntersection(event) {
    var mouseNDC = s.util.getNDC(event.pageX, event.pageY, window.innerWidth, window.innerHeight);

    var vector = new THREE.Vector3(mouseNDC.x, mouseNDC.y, 1);
    s.projector.unprojectVector(vector, game.camera);

    var cameraPos = game.player.ship.root.localToWorld(game.camera.position.clone());

    var ray = new THREE.Raycaster(cameraPos, vector.sub(cameraPos).normalize());

    var objects = items.slice(0).map(function(item) {
      return item.root;
    });
    objects.push(game.map.items.Moon.root);

    var intersects = ray.intersectObjects(objects);

    if (intersects.length) {
      return intersects[0];
    }

    return null;
  }

  $(window).on('keydown', function(event) {
    if (event.which === 192) { // tilde / backtick key
      currentObjectIndex++;
      if (currentObjectIndex > possibleObjects.length - 1) {
        currentObjectIndex = 0;
      }
      useObject(possibleObjects[currentObjectIndex])
    }
    else if (event.which === 9) { // tab key
      currentTeam = currentTeam === 'human' ? 'alien' : 'human';
      setInfo();
      event.preventDefault();
    }
  });

  $(window).on('mousemove', function(event) {
    if (!game.map.items.Moon) {
      return;
    }

    var point = getPointOnMoon(event);

    if (point) {
      // Rotate as needed
      pivot.lookAt(point);
    }
  });

  $(window).on('mousewheel', function(event) {
    var amount = Math.PI/32;

    // Get direction
    if (event.originalEvent.wheelDelta > 0) {
      amount = -amount;
    }

    // Store cumilative rotation
    currentRotation += amount;

    // Rotate current item
    if (currentItem) {
      currentItem.mapRotation = currentRotation;
      currentItem.root.rotateOnAxis(new THREE.Vector3(0, 1, 0), amount);
    }
  });

  $(window).on('click', function(event) {
    if (!game.map.items.Moon) {
      return;
    }

    var intersection = getIntersection(event);

    if (intersection) {
      if (intersection.object === game.map.items.Moon.root) {
        placeItem();
      }
      else {
        // Find object in items list
        var item = items.find(function(testItem) {
          return testItem.root === intersection.object;
        });

        if (item) {
          removeItem(item);
        }
        else {
          console.error('Could not find intersected item ', interesction.object);
        }
      }
    }
  });
}