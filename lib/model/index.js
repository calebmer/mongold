import _ from 'lodash';
import {whenReady} from '../utils';
import Assert from 'assert';
import {EventEmitter} from 'events';
import {database as defaultDatabase} from '../index';
import Database from '../database';

function Model(name, database) {

  // We actually want to return a constructor function
  // So let's set it up and have it extend `Document`
  var constructor = function (document) {

    var self = this;

    // If not using `new` syntax, force `new`
    if (!(self instanceof constructor)) {
      return new constructor(document);
    }

    // Extend using the document
    _.extend(self, constructor.clean(document || {}));

    self.check();
  };

  // Force the right prototype onto constructor
  Object.setPrototypeOf(constructor, Model.prototype);

  // Super constructor call
  EventEmitter.apply(constructor);
  whenReady(constructor);

  constructor._name = name;

  // Use the default mongo database if undefined
  constructor._database = database || defaultDatabase;

  if (!constructor._database || !(constructor._database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  constructor._database.on('ready', () => {

    constructor._collection = constructor._database._connection.collection(constructor._name);
    constructor.emit('ready', constructor._collection);
  });

  var bind = (method, context, args) => constructor[method].apply(constructor, [context].concat(_.toArray(args)));

  constructor.prototype = Object.create({
    check: function () { return bind('check', this, arguments); },
    validate: function () { return bind('validate', this, arguments); },
    save: function (callback) {

      var document = _.clone(this);
      callback = callback || Assert.ifError;

      constructor.save(document, (error, id) => {

        this._id = id;
        callback(error, id);
      });
    }
  });

  // Overrides `this` when using `new` syntax
  return constructor;
}

import * as Write from './write';
import * as Read from './read';
import * as Schema from './schema';
import * as Indexes from './indexes';
import * as Context from './context';

// Establish the correct prototype chain
// Function > EventEmitter > Model
Model.prototype = (() => {

  var prototype = Object.create(Function.prototype);
  // `instanceof EventEmitter` won't work with this method, oh well
  _.extend(prototype, EventEmitter.prototype);

  prototype = Object.create(prototype);
  _.extend(prototype, Write, Read, Schema, Indexes, Context);

  return prototype;
})();

module.exports = Model;
