import * as _ from 'lodash';
import Validator from 'is-my-json-valid';

var internals = {};

internals.updateState = function () {

  if (!this._schema) { this._schema = {}; }
  if (!this._schema.object) { this._schema.object = {}; }
};

internals.recompileValidators = function () {

  this._schema.validate = Validator(this._schema.object);
  this._schema.validateGreedily = Validator(this._schema.object, { greedy: true });
};

export var validate = function (document, greedy) {

  internals.updateState.call(this);

  if (greedy === undefined) {
    greedy = true;
  }

  var validateSingle = this._schema.validate;
  var validateGreedily = this._schema.validateGreedily;
  var errors;

  if (greedy) {
    if (!validateGreedily) { return []; }

    validateGreedily(document);
    errors = validateGreedily.errors;
    return errors ? errors : [];
  } else {
    if (!validateSingle) { return null; }

    validateSingle(document);
    errors = validateSingle.errors;
    return errors && errors.length > 0 ? errors[0] : null;
  }
};

export var check = function (document) {

  var error = this.validate(document, false);

  if (error) {
    var throwError = new Error(`Document failed validation at field '${error.field}'`);
    throwError.field = error.field;
    throw throwError;
  }
};

export var attachSchema = function (attachment) {

  internals.updateState.call(this);

  _.merge(this._schema.object, attachment, (a, b) => _.isArray(a) ? a.concat(b) : undefined);

  internals.recompileValidators.call(this);
};

export var detachSchema = function () {

  internals.updateState.call(this);
  this._schema.object = {};
  internals.recompileValidators.call(this);
};

export var schema = function () { return this._schema.object; };
