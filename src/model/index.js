import _ from 'lodash';
import Assert from 'assert';
import {EventEmitter} from 'events';
import {whenReady, getCallback} from '../utils';
import Mongold from '../index';
import Database from '../database';

function Model(name, options = {}) {

  _.defaults(options, {
    // Use the default database if none was passed
    database: Mongold.database,
    documentEndpoint: `/${name}/:id`,
    type: _.capitalize(name[name.length - 1] === 's' ? name.substring(0, name.length - 1) : name)
  });

  if (!options.database || !(options.database instanceof Database)) {
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

  // Define the uneditable name and database values
  Object.defineProperty(constructor, '_name', { value: name });
  Object.defineProperty(constructor, '_database', { value: options.database });
  constructor._type = options.type;

  constructor._database.on('ready', () => {

    Object.defineProperty(constructor, '_collection', {
      value: constructor._database._connection.collection(constructor._name)
    });
    constructor.emit('ready', constructor._collection);
  });

  var bind = (method, context, args) => constructor[method].apply(constructor, [context].concat(_.toArray(args)));

  constructor.getUrl = (id) => id ? Mongold.serverUrl + options.documentEndpoint.replace(':id', id) : undefined;

  constructor.prototype = Object.create({
    clean: function () { return bind('clean', this, arguments); },
    check: function () { return bind('check', this, arguments); },
    validate: function () { return bind('validate', this, arguments); },
    restrict: function () { return bind('restrict', this, arguments); },
    linkify: function () { return bind('linkify', this, arguments); },
    getUrl: function () { return constructor.getUrl(this._id); },
    save: function () {

      var args = _.toArray(arguments);
      var callback = getCallback(args) || Assert.ifError;
      var options = args.shift() || {};

      constructor.save(_.clone(this), options, (error, id) => {

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
import * as Joins from './joins';
import * as Access from './access';

// Establish the correct prototype chain
// Function > EventEmitter > Model
Model.prototype = (() => {

  // Becuse we reset the return object prototype (which is a function), we should have it extend a function
  var prototype = Object.create(Function.prototype);

  // `instanceof EventEmitter` won't work using this method, oh well
  _.extend(prototype, EventEmitter.prototype);

  prototype = Object.create(prototype);
  _.extend(prototype, Schema, Ops, Indexes, Joins, Access);

  return prototype;
})();

export default Model;
