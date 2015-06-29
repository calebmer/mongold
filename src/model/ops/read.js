import _ from 'lodash';
import Assert from 'assert';
import {Id} from '../../index';
import {getCallback} from '../../utils';

var internals = {};

internals.formatOptions = function (options) {

  if (_.isArray(options.include)) { options.include.forEach(property => options.projection[property] = 1); }
  if (_.isArray(options.exclude)) { options.exclude.forEach(property => options.projection[property] = 0); }

  // Allow for prettier sort definitions
  if (options.sort) {
    options.sort = _.mapValues(options.sort, value => {

      if (value === 'asc' || value === 'ascending') { return 1; }
      if (value === 'desc' || value === 'descending') { return -1; }
      return value;
    });
  }
};

export function find() {

  var args = _.toArray(arguments);
  var callback = getCallback(args) || Assert.ifError;

  var selector = args.shift() || {};
  var options = args.shift() || {};

  if (selector._id && !(selector._id instanceof Id)) {
    selector._id = new Id(selector._id);
  }

  _.defaults(options, {
    cursor: false,
    terse: false,
    projection: {}
  });

  if (options.terse) {
    var terseProperties = Object.keys(_.filter(this.extractOptions('terse'), config => config.terse));
    terseProperties.forEach(property => _.set(options.projection, property, 1));
  }

  internals.formatOptions(options);

  this.on('ready', () => {

    var cursor = this._collection.find(selector, options.projection);

    if (options.sort) { cursor.sort(options.sort); }
    if (options.skip) { cursor.skip(options.skip); }
    if (options.limit) { cursor.limit(options.limit); }

    // If the user wants the cursor
    if (options.cursor) {
      callback(null, cursor);
    }

    cursor.toArray((error, documents) => {

      if (error) { return callback(error); }

      // Use constructor on documents
      documents = documents.map(document => new this(document, false));

      callback(null, documents);
    });
  });
}

export function findOne() {

  var args = _.toArray(arguments);
  var callback = getCallback(args) || Assert.ifError;

  var selector = args.shift() || {};
  var options = args.shift() || {};

  _.extend(options, { limit: 1 });

  this.find(selector, options, (error, documents) => callback(error, documents[0]));
}
