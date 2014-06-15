s.Touch = new Class({
  toString: 'Touch',

  construct: function(game, player) {
    var self = this;
    this.keyCodes = {};

    this.handleTouches = this.handleTouches.bind(this);
    this.setScreenVariables = this.setScreenVariables.bind(this);

    this.fire = false;

    // Joysticks
    var joyWidth = 240;
    var joyOptions = {
      width: joyWidth,
      deadZone: joyWidth * 0.10,
      margin: joyWidth * 0.15
    };

    this.joyStick = new s.Touch.Joystick(joyOptions);
    // this.rightStick = new s.Touch.Joystick(joyOptions);

    // Buttons
    var buttonWidth = 96;
    var buttonOptions = {
      width: buttonWidth,
      margin: buttonWidth * 0.025
    };
    this.fireButton = new s.Touch.Button(buttonOptions);
    this.retroThrustButton = new s.Touch.Button(buttonOptions);
    this.thrustButton = new s.Touch.Button(buttonOptions);

    // Set parameters
    this.setScreenVariables();

    // Listen to events
    window.addEventListener('touchstart', this.handleTouches, false);
    window.addEventListener('touchmove', this.handleTouches, false);
    window.addEventListener('touchend', this.handleTouches, false);
    window.addEventListener('resize', this.setScreenVariables, false);
  },

  setScreenVariables: function() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Use previously passed margin
    var joyWidth = this.joyStick.width;
    var joyMargin = this.joyStick.margin;

    var buttonWidth = this.fireButton.width;
    var buttonMargin = this.fireButton.margin;

    var joyX = this.width - joyMargin - joyWidth/2;
    var joyY = this.height - joyMargin - joyWidth / 2;

    var buttonX = 0 + buttonWidth;
    var buttonY = this.height - buttonWidth;

    this.joyStick.configure({
      position: {
        x: joyX,
        y: joyY
      }
    });

    this.thrustButton.configure({
      text: 'thrust',
      color: 'blue',
      position: {
        x: buttonX,
        y: buttonY - buttonWidth * 2 + buttonWidth/2
      }
    });

    this.retroThrustButton.configure({
      text: 'retro-thrust',
      color: 'green',
      position: {
        x: buttonX,
        y: buttonY
      }
    });

    this.fireButton.configure({
      text: 'fire',
      color: 'red',
      position: {
        x: buttonX,
        y: buttonY - buttonWidth + buttonWidth/4
      }
    });
  },

  destruct: function() {
    window.removeEventListener('resize', this.setScreenVariables, false);
    window.removeEventListener('touchstart', this.handleTouches, false);
    window.removeEventListener('touchmove', this.handleTouches, false);
    window.removeEventListener('touchend', this.handleTouches, false);
  },

  handleTouches: function(evt) {
    // Stop scrolling
    evt.preventDefault();

    this.fire = false;

    // Reset state before trying each touch
    this.joyStick.reset();
    this.fireButton.reset();
    this.thrustButton.reset();
    this.retroThrustButton.reset();

    for (var i = 0; i < evt.touches.length; i++) {
      var touch = evt.touches[i];

      this.retroThrustButton.update(touch);
      this.thrustButton.update(touch);
      this.fireButton.update(touch);
      this.joyStick.update(touch);
    }
  }
});

