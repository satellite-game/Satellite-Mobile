/*
Satellite
Copyright (C) 2013 Larry Davis
*/

window.s = {
    config: {
        sound: {
            enabled: false, // @perf: Extremely slow on iOS
            silentDistance: 10000,
            sounds: {
                laser: 'game/sounds/laser.mp3'
            }
        }
    },

    init: function() {
        console.log('Satellite starting...');
        // Create a projector for 2D <-> 3D calculations
        s.projector = new THREE.Projector();

        // Create a model loader
        s.loader = new THREE.JSONLoader();
        s.game = new s.SatelliteGame();
    }
};
