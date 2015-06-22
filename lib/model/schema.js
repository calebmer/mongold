import _ from 'lodash';
import Validator from 'is-my-json-valid';

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

export var clean = function (document) {

  internals.updateState.call(this);

  // Save the id
  var documentId = document._id;

  if (this._schema.filter) {
    document = this._schema.filter(document);
    // If the id was cleaned out, re-set it
    if (!document._id) { document._id = documentId; }
    return document;
  }

  return document;
};

export var attachSchema = function (attachment) {

  internals.updateState.call(this);

  if (!this._schema.object) {
    this._schema.object = attachment;
    internals.recompileValidators.call(this);
    return;
  }

  // Merge the schemas, if we are merging arrays concatenate them and make sure values are unique
  _.merge(this._schema.object, attachment, (a, b) => _.isArray(a) ? _.unique(a.concat(b)) : undefined);

  internals.recompileValidators.call(this);
};

export var detachSchema = function () {

  internals.updateState.call(this);
  delete this._schema.object;
  internals.recompileValidators.call(this, true);
};

export var schema = function () { return this._schema.object; };
