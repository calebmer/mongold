var Debug = require('debug')('mongold:database');
var EventEmitter = require('events').EventEmitter;
var MongoClient = require('mongodb').MongoClient;
var Utils = require('./utils');

// ES6: class
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

    if (!db) {
      throw new Error('Connection to a database could not be established');
    }

    // We made it!
    self._connection = db;
    Debug('connected to ' + self._connection.s.options.url);
    self.emit('ready', self._connection);
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
