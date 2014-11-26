/*!
Satellite
Copyright (C) 2014 Contributors
*/

window.s = {
  config: {
    sound: {
      enabled: true
    },
    // @perf: Disable shadows as they have a 95% impact on iOS
    shadows: false
  },

  ships: {
    human: ['light', 'heavy'],
    alien: ['light', 'heavy']
  },

  constants: {
    ship: {
      rollSpeed: Math.PI/8,
      pitchSpeed: Math.PI/24,
      yawSpeed: Math.PI/24,
      forwardThrust: 25,
      backwardThrust: 15,

      linearDamping: 0.5,
      angularDamping: 0.999
    }
  },

  init: function() {
    console.log('Satellite starting...');

    // Create a model loader
    s.loader = new THREE.JSONLoader();

    // Start the game
    s.game = new s.SatelliteGame();
  }
};
