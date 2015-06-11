var _ = require('lodash');
var Assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Mongold = require('../index');
var Utils = require('../utils');
var Database = require('../database');

// ES6: class
function Model(name, database) {

  // We actually want to return a constructor function
  // So let's set it up and have it extend `Document`
  var constructor = function Document(document) {

    var self = this;

    // If not using `new` syntax, force `new`
    if (!(self instanceof Document)) {
      return new Document(document);
    }

    // Extend using the document
    _.extend(self, document);

    self.check();
  };

  // ES6: arrow function
  var bind = function (method, context, args) { return constructor[method].apply(constructor, [context].concat(_.toArray(args))); };

  // ES6: arrow functions
  constructor.prototype = Object.create({
    check: function () { return bind('check', this, arguments); },
    validate: function () { return bind('validate', this, arguments); },
    save: function (callback) {

      var self = this;
      var document = _.clone(self);
      callback = callback || Assert.ifError;

      constructor.save(document, function (error, id) {

        self._id = id;
        callback(error, id);
      });
    }
  });

  // Set the correct prototype for the new `constructor`.
  // This method is claimed to be not efficient, but in benchmark tests it only starts
  //   to matter at about 25e6 to 10e7 iterations. Actually up until about 25e6
  //   iterations, `Object.setPrototypeOf` was actually faster than `Object.create`.
  // @see https://gist.github.com/calebmer/c74e2a7941044e5f28b8
  Object.setPrototypeOf(constructor, Model.prototype);

  // Super constructor call
  EventEmitter.apply(constructor);
  Utils.whenReady(constructor);

  constructor._name = name;

  // Use the default mongo database if undefined
  constructor._database = database || Mongold.database;

  if (!constructor._database || !(constructor._database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  constructor._database.on('ready', function () {

    constructor._collection = constructor._database._connection.collection(constructor._name);
    constructor.emit('ready', constructor._collection);
  });

  // Overrides `this` when using `new` syntax
  return constructor;
}

// Establish the correct prototype chain
// Function > EventEmitter > Model
Model.prototype = (function () {

  var prototype = Object.create(Function.prototype);
  // `instanceof EventEmitter` won't work with this method, oh well
  _.extend(prototype, EventEmitter.prototype);

  prototype = Object.create(prototype);
  _.extend(prototype, require('./write'), require('./read'), require('./schema'));

  return prototype;
}());

module.exports = Model;
