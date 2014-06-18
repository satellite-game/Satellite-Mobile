/*!
Satellite
Copyright (C) 2014 Contributors
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

    constants: {
        ship: {
            rollSpeed: Math.PI/8,
            pitchSpeed: Math.PI/32,
            yawSpeed: Math.PI/32,
            forwardThrust: 25,
            backwardThrust: 15,

            linearDamping: 0.5,
            angularDamping: 0.99
        }
    },

    init: function() {
        console.log('Satellite starting...');

        // Create a projector for 2D <-> 3D calculations
        s.projector = new THREE.Projector();

        // Create a model loader
        s.loader = new THREE.JSONLoader();

        // Start the game
        s.game = new s.SatelliteGame();
    }
};
