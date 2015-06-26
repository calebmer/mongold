import _ from 'lodash';
import {whenReady} from '../utils';
import Assert from 'assert';
import {EventEmitter} from 'events';
import Mongold from '../index';
import Database from '../database';

function Model(name, database) {
  // Use the default database if none was passed
  database = database || Mongold.database;

  if (!database || !(database instanceof Database)) {
    throw new Error('Model requires a database');
  }

  // We actually want to return a constructor function
  // So let's set it up and have it extend `Document`
  var constructor = function (document, shouldValidate = true) {

    // If not using `new` syntax, force `new`
    if (!(this instanceof constructor)) {
      return new constructor(document);
    }

    // Extend using the document
    _.extend(this, document || {});

    if (shouldValidate) {
      this.clean();
      this.check();
    }
  };

  // Force the right prototype onto constructor
  Object.setPrototypeOf(constructor, Model.prototype);

  // Super constructor call
  EventEmitter.apply(constructor);
  whenReady(constructor);

  // Define the uneditable name value
  Object.defineProperty(constructor, '_name', { value: name });
  constructor.location = `/${constructor._name}`;

  // Use the default mongo database if undefined
  constructor._database = database;

  constructor._database.on('ready', () => {

    constructor._collection = constructor._database._connection.collection(constructor._name);
    constructor.emit('ready', constructor._collection);
  });

  var bind = (method, context, args) => constructor[method].apply(constructor, [context].concat(_.toArray(args)));

  constructor.prototype = Object.create({
    clean: function () { return bind('clean', this, arguments); },
    check: function () { return bind('check', this, arguments); },
    validate: function () { return bind('validate', this, arguments); },
    format: function () { return bind('format', this, arguments); },
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

import * as Schema from './schema';
import * as Ops from './ops';
import * as Indexes from './indexes';
import * as Context from './context';

// Establish the correct prototype chain
// Function > EventEmitter > Model
Model.prototype = (() => {

  // Becuse we reset the return object prototype (which is a function), we should have it extend a function
  var prototype = Object.create(Function.prototype);

  // `instanceof EventEmitter` won't work using this method, oh well
  _.extend(prototype, EventEmitter.prototype);

  prototype = Object.create(prototype);
  _.extend(prototype, Schema, Ops, Indexes, Context);

  return prototype;
})();

export default Model;
