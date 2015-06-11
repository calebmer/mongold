import * as _ from 'lodash';
import {ifError} from 'assert';

var internals = {};

internals.formatOptions = function (options) {

  _.defaults(options, { cursor: false });

  // Allow users to define own projection properties
  options.projection = options.projection || {};

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

export var find = function () {

  var args = _.toArray(arguments);
  var callback = ifError;

  if (_.isFunction(_.last(args))) {
    callback = args.pop();
  }

  var selector = args.shift() || {};
  var options = args.shift() || {};

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

    cursor.toArray(callback);
  });
};
