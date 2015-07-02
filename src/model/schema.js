import _ from 'lodash';
import Async from 'async';
import Pointer from 'json-pointer';
import Parser from 'json-schema-parser';
import Validator from 'is-my-json-valid';
import {getCallback, pointerToPath} from '../utils';

var internals = {};

internals.updateState = function () {

  if (!this._schema) { this._schema = {}; }
};

internals.recompileValidators = function (reset) {

  if (reset) {
    delete this._schema.validate;
    delete this._schema.validateGreedily;
    delete this._schema.filter;
    return;
  }

  this._schema.validate = Validator(this._schema.object);
  this._schema.validateGreedily = Validator(this._schema.object, { greedy: true });
  this._schema.filter = Validator.filter(this._schema.object, { additionalProperties: false });
};

export function validate(document, options = {}) {

  internals.updateState.call(this);

  _.defaults(options, { greedy: true });

  var validateSingle = this._schema.validate;
  var validateGreedily = this._schema.validateGreedily;

  var errors = (() => {

    if (options.greedy) {
      if (!validateGreedily) { return []; }

      validateGreedily(document);
      return validateGreedily.errors ? validateGreedily.errors : [];
    } else {
      if (!validateSingle) { return []; }

      validateSingle(document);
      return validateSingle.errors ? validateSingle.errors : [];
    }
  })();

  if (options.greedy) {
    return errors;
  } else {
    return errors[0];
  }
}

export function check(document) {

  var error = this.validate(document, { greedy: false });

  if (error) {
    var throwError = new Error(`Document failed validation at field '${error.field}'`);
    throwError.field = error.field;
    throw throwError;
  }
}

export function clean(document) {

  internals.updateState.call(this);

  if (this._schema.filter) {
    return this._schema.filter(document);
  }

  return document;
}

export function attachSchema(attachment) {

  internals.updateState.call(this);

  if (!this._schema.object) {
    this._schema.object = {
      'type': 'object',
      'properties': { '_id': {} }
    };
  }

  // Resolve local refs
  attachment = Parser.parse(attachment);

  // Merge the schemas, if we are merging arrays concatenate them and make sure values are unique
  _.merge(this._schema.object, attachment, (a, b) => _.isArray(a) ? _.unique(a.concat(b)) : undefined);
  internals.recompileValidators.call(this);
}

export function detachSchema() {

  internals.updateState.call(this);
  delete this._schema.object;
  internals.recompileValidators.call(this, true);
}

export function unique(pointers) {

  if (!_.isArray(pointers)) { pointers = [pointers]; }
  this._unique = (this._unique || []).concat(pointers);
}

export function validateUnique() {

  var args = _.toArray(arguments);
  var callback = getCallback(args);
  var document = args.shift();
  var options = args.shift() || {};

  if (!_.isFunction(callback)) { throw new Error('To validate uniquness a callback must be defined'); }

  var errors = this.validate(document, options);

  Async.each(this._unique, (pointer, next) => {

    if (!Pointer.has(document, pointer)) { return next(); }
    var value = Pointer.get(document, pointer);
    var selector = {};
    Pointer.set(selector, pointer, value);

    this.findOne(selector, { include: ['_id'] }, (error, alreadyExists) => {

      if (error) { return next(error); }
      if (alreadyExists) {
        errors.push({
          field: 'data.' + pointerToPath(pointer),
          message: 'already exists'
        });
      }
      next();
    });
  }, error => {

    if (error) { return callback(error); }
    callback(null, errors);
  });
}
