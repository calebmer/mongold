var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Mongold = require('../index');
var Database = require('../database');
var Utils = require('../utils');

// ES6: class
function Model(name, database) {

  var self = this;

  if (!(self instanceof Model)) {
    return new Model(name, database);
  }

  // Super constructor call
  EventEmitter.apply(this);
  Utils.whenReady(self);

  self.name = name;

  // Use the default mongo database if undefined
  self._database = database || Mongold.database;

  if (!self._database || !(self._database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  self._database.on('ready', function () {

    self._collection = self._database._connection.collection(self.name);
    self.emit('ready', self._collection);
  });
}

Model.prototype = Object.create(EventEmitter.prototype);

_.extend(Model.prototype, require('./write'));

module.exports = Model;
