var EventEmitter = require('events').EventEmitter;
var Mongold = require('./index');
var Database = require('./database');
var Utils = require('./utils');

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

Model.prototype.insert = function (document, callback) {

  var self = this;

  self._collection.insert(document, function (error, result) {

    if (error) { return callback(error); }

    // This would be a good thing to destructure
    var ops = result.ops;
    result = result.result;

    if (!result.ok || result.n !== 1) {
      throw new Error('Error inserting document');
    }

    callback(null, ops[0]);
  });
};

module.exports = Model;
