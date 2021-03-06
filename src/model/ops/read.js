import _ from 'lodash';
import Assert from 'assert';
import {ObjectId} from 'mongodb';
import {getCallback, pointerToPath} from '../../utils';

var internals = {};

internals.formatArgs = function (args) {

  if (!this._collection) { throw new Error('Wait for a MongoDB connection to be established before finding documents'); }

  args = _.toArray(args);
  var callback = getCallback(args);
  var selector = args.shift() || {};
  var options = args.shift() || {};

  if (selector._id && !(selector._id instanceof ObjectId)) {
    try {
      selector._id = new ObjectId(selector._id);
    } catch (error) { /* Silence */ }
  }

  if (_.isArray(options)) { options = { include: options }; }

  _.defaults(options, {
    projection: {},
    terse: false
  });

  if (options.terse && this._terse) { options.include = (options.include || []).concat(this._terse); }

  if (_.isArray(options.include) && _.isArray(options.exclude)) {
    options.include = _.difference(options.include, options.exclude);
    delete options.exclude;
  }

  if (_.isArray(options.include)) { options.include.map(pointerToPath).forEach(property => options.projection[property] = 1); }
  if (_.isArray(options.exclude)) { options.exclude.map(pointerToPath).forEach(property => options.projection[property] = 0); }

  delete options.include;
  delete options.exclude;

  // Allow for prettier sort definitions
  if (options.sort) {
    options.sort = _.mapValues(options.sort, value => {

      if (value === 'asc' || value === 'ascending') { return 1; }
      if (value === 'desc' || value === 'descending') { return -1; }
      return value;
    });
  }

  return {selector, options, callback};
};

export function find() {

  var {selector, options, callback} = internals.formatArgs.call(this, arguments);

  var cursor = this._collection.find(selector, options.projection);

  if (options.sort) { cursor.sort(options.sort); }
  if (options.skip) { cursor.skip(options.skip); }
  if (options.limit) { cursor.limit(options.limit); }

  cursor.map(document => new this(document, false));

  if (!callback) { return cursor; }
  cursor.toArray((error, documents) => {

    callback(error, documents);
    cursor.close();
  });
}

export function findOne() {

  var {selector, options, callback} = internals.formatArgs.call(this, arguments);
  callback = callback || Assert.ifError;

  this._collection.findOne(selector, options.projection,
    (error, document) => callback(error, document ? new this(document, false) : undefined)
  );
}

export function terse(pointers) {

  if (!_.isArray(pointers)) { pointers = [pointers]; }
  this._terse = (this._terse || []).concat(pointers);
}
