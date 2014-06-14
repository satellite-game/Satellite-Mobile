s.util = {};

Math.toDegrees = function(radians) {
  return radians * 180/Math.PI;
};

Math.toRadians = function(degrees) {
  return degrees * Math.PI/180;
};

Math.epsilon = 1e-12;

/**
  Load textures

  @param {Object} options  Options object
  @param {Array} models  Array of texture names to load
  @param {Function} complete  Function to call when loading is complete
  @param {Function} progress  Function to call when model is loaded
*/
s.util.loadTextures = function(options) {
  var toLoad = options.textures.length;

  // Hold textures
  var textures = {};

  var loaded = function(name, texture) {
    // Store texture
    textures[name] = texture;

    // Track progress
    toLoad--;
    var pct = (options.textures.length-toLoad)/options.textures.length*100;

    if (typeof options.progress === 'function') {
      options.progress(pct, textures[name]);
    }
    console.log('Loading textures: '+pct.toFixed(0)+'%');

    if (toLoad === 0) {
      if (typeof options.complete === 'function') {
        options.complete(textures);
      }
    }
  };

  options.textures.forEach(function(name, index) {
    // Strip file extension
    var shortName = name.split('.')[0];

    new THREE.ImageUtils.loadTexture('game/textures/'+name, {}, loaded.bind(null, shortName));
  });
};

/**
  Load models

  @param {Object} options  Options object
  @param {Array} models  Array of model names to load
  @param {Function} complete  Function to call when loading is complete
  @param {Function} progress  Function to call when model is loaded
*/
s.util.loadModels = function(options) {
  var toLoad = options.models.length;

  // Hold models
  var models = {};

  var loaded = function(name, geometry, materials) {
    // Store model and materials
    models[name] = {
      geometry: geometry,
      materials: materials
    };

    // Track progress
    toLoad--;
    var pct = (options.models.length-toLoad)/options.models.length*100;
    if (typeof options.progress === 'function') {
      options.progress(pct, models[name]);
    }
    console.log('Loading models: '+pct.toFixed(0)+'%');

    if (toLoad === 0) {
      if (typeof options.complete === 'function') {
        options.complete(models);
      }
    }
  };

  options.models.forEach(function(name, index) {
    s.loader.load('game/models/'+name+'.json', loaded.bind(null, name));
  });
};

/**
  Get 3D coordinates of a 2D point

  @param {Number} x  2D x coordinate
  @param {Number} y  2D y coordinate
  @param {Number} width  Width of canvas
  @param {Number} height  Height of canvas
  @param {THREE.PerspectiveCamera} camera  three.js camera instance
*/
s.util.get3DCoords = function(x, y, width, height, camera) {
  // Convert to normalized device coordinates
  var ndc = s.util.getNDC(x, y, width, height);

  var startVector = new THREE.Vector3();
  var endVector = new THREE.Vector3();
  var dirVector = new THREE.Vector3();
  var goalVector = new THREE.Vector3();
  var t;

  // Create vectors above and below ground plane at our NDCs
  startVector.set(ndc.x, ndc.y, -1.0);
  endVector.set(ndc.x, ndc.y, 1.0);

  // Convert back to 3D world coordinates
  startVector = s.projector.unprojectVector(startVector, camera);
  endVector = s.projector.unprojectVector(endVector, camera);

  // Get direction from startVector to endVector
  dirVector.subVectors(endVector, startVector);
  dirVector.normalize();

  // Find intersection where y = 0
  t = startVector.y / -(dirVector.y);

  // Find goal point
  goalVector.set(
    startVector.x + t * dirVector.x,
    startVector.y + t * dirVector.y,
    startVector.z + t * dirVector.z
  );

  return goalVector;
};

/**
  Create a ray between two points

  @param {THREE.Vector3} pointA  Start point
  @param {THREE.Vector3} pointB  End point
*/
s.util.createRay = function(pointA, pointB) {
  var rayStart = pointA;
  var rayDirection = new THREE.Vector3();
  rayDirection.subVectors(pointB, pointA).normalize();

  return new THREE.Raycaster(rayStart, rayDirection);
};

/**
  Create a ray between two points

  @param {Number} value  Value to clamp
  @param {Number} min    Lowest value
  @param {Number} max    Highest value
*/
s.util.clamp = function(value, min, max) {
  return Math.max(Math.min(value, max), min)
};

/**
  Get the normalized device coordinate

  @param {Number} x  2D x coordinate
  @param {Number} y  2D y coordinate
  @param {Number} width  Width of canvas
  @param {Number} height  Height of canvas
*/
s.util.getNDC = function(x, y, width, height) {
  return {
    x: (x / width) * 2 - 1,
    y: -(y / height) * 2 + 1
  };
};

/**
  Get 2D coordinates from a Vector3

  @param {THREE.Vector3} objVector  Vector representing the object position
  @param {Number} width  Width of canvas
  @param {Number} height  Height of canvas
*/
s.util.get2DCoords = function(objVector, width, height) {
  var vector3D = objVector.clone();

  var vector2D = this.projector.projectVector(vector3D, this.camera);

  vector2D.y = -(vector2D.y*height - height)/2;
  vector2D.x = (vector2D.x*width + width)/2;

  return vector2D;
};

s.util.debounce = function(func, wait, immediate) {
  var result;
  var timeout = null;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
};

s.util.largerThan = function(vector, value){
  if(Math.abs(vector.x) > value || Math.abs(vector.y) > value || Math.abs(vector.z) > value) return true;
  return false;
};

// Get a random coordinate
s.util.getRandomCoordinate = function(){
  var coefficient = 1;
  if (Math.random() > 0.5){
    coefficient = -1;
  }
  return Math.floor(Math.random()* 15000 + 15000) * coefficient;
};

s.util.throttle = function(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : new Date().getTime();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = new Date().getTime();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      clearTimeout(timeout);
      timeout = null;
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

