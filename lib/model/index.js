var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Mongold = require('../index');
var Database = require('../database');
var Utils = require('../utils');

// ES6: class
function Model(name, database) {

  // We actually want to return a constructor function
  var self = function () {};

  // Extend using all our things
  _.extend(self, EventEmitter.prototype, require('./write'), require('./read'));

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

module.exports = Model;
