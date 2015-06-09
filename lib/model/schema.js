var _ = require('lodash');
var Validator = require('is-my-json-valid');

var internals = {};

internals.updateState = function () {

  if (!this._schema) { this._schema = {}; }
  if (!this._schema.object) { this._schema.object = {}; }
};

internals.recompileValidators = function () {

  var schema = this._schema.object;
  this._schema.validate = Validator(schema);
  this._schema.validateGreedily = Validator(schema, { greedy: true });
};

exports.validate = function (document, greedy) {

  if (greedy === undefined) {
    greedy = true;
  }

  var validate = this._schema.validate;
  var validateGreedily = this._schema.validateGreedily;

  if (greedy) {
    if (!validateGreedily) { return []; }

    validateGreedily(document);
    return validateGreedily.errors;
  } else {
    if (!validate) { return null; }

    validate(document);
    var errors = validate.errors;
    return errors.length > 0 ? errors[0] : null;
  }
};

exports.check = function (document) {

  var error = this.validate(document, false);

  if (error) {
    throw _.extend(new Error('Document failed validation at field ' + error.field), _.pick(error, 'field'));
  }
};

exports.attachSchema = function (schema) {

  internals.updateState.call(this);

  _.merge(this._schema.object, schema, function (a, b) {

    if (_.isArray(a)) {
      return a.concat(b);
    }
  });

  internals.recompileValidators.call(this);
};

exports.detachSchema = function () {

  internals.updateState.call(this);
  this._schema.object = {};
  internals.recompileValidators.call(this);
};

exports.schema = function () { return this._schema.object; };
