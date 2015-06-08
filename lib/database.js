var Debug = require('debug')('mongold:database');
var EventEmitter = require('events').EventEmitter;
var MongoClient = require('mongodb').MongoClient;
var Utils = require('./utils');

// TODO: convert to class with ES6
function Database(url) {

  var self = this;

  if (!(self instanceof Database)) {
    return new Database(url);
  }

  // Super constructor call
  EventEmitter.apply(this);
  Utils.whenReady(self);

  MongoClient.connect(url, function (err, db) {

    if (err) { throw err; }

    // We made it!
    self._connection = db;
    self.emit('ready', self._connection);

    Debug('connected to ' + self._connection.s.options.url);
  });
}

Database.prototype = Object.create(EventEmitter.prototype);

Database.prototype.disconnect = function () {

  var self = this;

  self.on('ready', function () {
    // Close connection then set to undefined
    var url = self._connection.s.options.url;

    self._connection.close();
    self._connection = undefined;
    self.emit('close');

    Debug('disconnected from ' + url);
  });
};

module.exports = Database;
