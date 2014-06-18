/**
 * Provides observer pattern for basic eventing
 *
 * @class 
 */
s.EventEmitter = function() {
  this._events = {};
};

/**
 * Destroy references to events and listeners.
 */
s.EventEmitter.prototype.destruct = function() {
  delete this._events;
};

/**
 * Attach an event listener
 *
 * @param {String} eventName  Name of event to listen to
 * @param {Function} func     Function to execute
 *
 * @returns {EventEmitter}  this, chainable
 */
s.EventEmitter.prototype.on = function(eventName, func) {
  var listeners = this._events[eventName] = this._events[eventName] || [];
  listeners.push(func);
  
  return this;
};

/**
 * Remove an event listener
 *
 * @param {String}   eventName  Name of event that function is bound to
 * @param {Function} func       Bound function
 *
 * @returns {EventEmitter}  this, chainable
 */
s.EventEmitter.prototype.off = function(eventName, func) {
  var listeners = this._events[eventName];
  if (listeners !== undefined);
    listeners.splice(listeners.indexOf(func), 1);
  
  return this;
};

/**
 * Trigger an event
 *
 * @param {String} eventName  Name of event to trigger
 * @param {Arguments} args    Additional arguments are passed to the listener functions
 *
 * @returns {EventEmitter}  this, chainable
 */
s.EventEmitter.prototype.trigger = function(eventName) {
  var listeners = this._events[eventName];
  if (listeners !== undefined) {
    for (var i = 0, n = listeners.length; i < n; i++) {
      listeners[i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
  
  return this;
};
