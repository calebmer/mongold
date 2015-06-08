var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Mongold = require('../index');
var Database = require('../database');
var Utils = require('../utils');

// ES6: class
function Model(name, database) {

  // We actually want to return a constructor function
  var self = function () {};

  // Set the correct prototype for the new `self`
  // This method is claimed to be not efficient, but in benchmark tests it only starts
  //   to matter at about 25e6 to 10e7 iterations. Actually up until about 25e6
  //   iterations, `Object.setPrototypeOf` was actually faster than `Object.create`.
  // @see https://gist.github.com/calebmer/c74e2a7941044e5f28b8
  Object.setPrototypeOf(self, Model.prototype);

  // Super constructor call
  EventEmitter.apply(self);
  Utils.whenReady(self);

  self._name = name;

  // Use the default mongo database if undefined
  self._database = database || Mongold.database;

  if (!self._database || !(self._database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  self._database.on('ready', function () {

    self._collection = self._database._connection.collection(self._name);
    self.emit('ready', self._collection);
  });

  return self;
}

// Establish the correct prototype chain
// Function => EventEmitter => Model
Model.prototype = (function () {

  var prototype = Object.create(Function.prototype);
  _.extend(prototype, EventEmitter.prototype);

  prototype = Object.create(prototype);
  _.extend(prototype, require('./write'), require('./read'));

  return prototype;
}());

module.exports = Model;
