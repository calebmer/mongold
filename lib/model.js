var EventEmitter = require('events').EventEmitter;
var Humongo = require('./index');
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

  // Use the default mongo database if undefined
  self._database = database || Humongo.database;

  if (!self._database || !(self._database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  self._database.on('ready', function () {

    self._collection = self._database._connection.collection(name);
    self.emit('ready', self._collection);
  });
}

Model.prototype = Object.create(EventEmitter.prototype);

Model.prototype.insert = function (document, callback) {

  var self = this;

  self._collection.insert(document, function (error, result, ops) {

    if (error) { return callback(error); }

    console.log(result);
    console.log(ops);

    callback();
  });
};

module.exports = Model;
