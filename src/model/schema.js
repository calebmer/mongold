import _ from 'lodash';
import Async from 'async';
import Validator from 'is-my-json-valid';
import * as Debug from '../debug';

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

  this._schema.validate = Validator(this._schema.object, { verbose: true });
  this._schema.validateGreedily = Validator(this._schema.object, { verbose: true, greedy: true });
  this._schema.filter = Validator.filter(this._schema.object, { additionalProperties: false });
};

export function validate(document, options = {}, callback) {

  internals.updateState.call(this);

  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }

  _.defaults(options, {
    greedy: true,
    unique: true
  });

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

  function reportErrors() {

    if (options.greedy) {
      return errors;
    } else {
      return errors[0];
    }
  }

  // If we have one error already, return it
  if (!options.greedy && errors.length > 0) {
    let error = reportErrors();
    if (callback) { callback(null, error); }
    return error;
  }
  // If there is a callback we are executing asynchronously
  if (callback) {
    Async.parallel([
      done => {

        if (!options.unique) { return done(); }

        Async.forEachOf(this._indexes, ({ unique }, key, next) => {

          if (!unique) { return next(); }

          var value = _.get(document, key);
          var selector = {};
          _.set(selector, key, value);
          this.findOne(selector, (error, notUnique) => {

            if (error) { return next(error); }
            if (notUnique) {
              errors.push({
                field: `data.${key}`,
                message: 'is not unique',
                value
              });
            }

            return next();
          });
        }, done);
      }
    ], error => {

      if (error) { return callback(error, false); }
      callback(null, reportErrors());
    });
  }

  return reportErrors();
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
    if (this.schema().additionalProperties === undefined) {
      Debug.model('Schema does not have property \'additionalProperties\' in the document root, cleansing may be unsucessful');
    }

    return this._schema.filter(document);
  }

  return document;
}

export function attachSchema(attachment) {

  internals.updateState.call(this);

  if (!this._schema.object) {
    this._schema.object = {
      'type': 'object',
      'properties': {
        '_id': {}
      }
    };
  }

  // Merge the schemas, if we are merging arrays concatenate them and make sure values are unique
  _.merge(this._schema.object, attachment, (a, b) => _.isArray(a) ? _.unique(a.concat(b)) : undefined);
  internals.recompileValidators.call(this);
}

export function detachSchema() {

  internals.updateState.call(this);
  delete this._schema.object;
  internals.recompileValidators.call(this, true);
}

export function schema(path) {

  if (path) {
    var schemaPartial = this._schema.object;

    path.split('.').forEach(segment => {

      if (schemaPartial && schemaPartial.type === 'object') {
        schemaPartial = schemaPartial.properties[segment];
      } else {
        schemaPartial = undefined;
      }
    });

    return schemaPartial;
  }

  return this._schema.object;
}

export function properties(path) {

  var keys = [];
  function scanSchema(prefix, schemaPartial) {

    if (prefix) { prefix += '.'; }

    if (schemaPartial && schemaPartial.type === 'object' && schemaPartial.properties) {
      _.each(schemaPartial.properties, (property, key) => {

        key = prefix + key;
        // If this is an id, we don't need to report it
        if (key === '_id') { return; }
        keys.push(key);
        scanSchema(key, property);
      });
    }
  }

  scanSchema(path || '', this.schema(path));
  return keys;
}
