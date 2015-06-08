var _ = require('lodash');
var Assert = require('assert');

var internals = {};

internals.formatOptions = function (options) {

  _.defaults(options, {
    cursor: false
  });

  // Allow users to define own projection properties
  options.projection = options.projection || {};

  if (_.isArray(options.include)) {
    // ES6: arrow function
    options.include.forEach(function (property) { options.projection[property] = 1; });
  }

  if (_.isArray(options.exclude)) {
    // ES6: arrow function
    options.exclude.forEach(function (property) { options.projection[property] = 0; });
  }

  // Allow for prettier sort definitions
  if (options.sort) {
    options.sort = _.mapValues(options.sort, function (value) {

      if (value === 'asc' || value === 'ascending') { return 1; }
      if (value === 'desc' || value === 'descending') { return -1; }
      return value;
    });
  }
};

exports.find = function () {

  var self = this;
  var args = _.toArray(arguments);
  var collection = self._collection;
  var callback = Assert.ifError;

  if (_.isFunction(_.last(args))) {
    callback = args.pop();
  }

  var selector = args.shift() || {};
  var options = args.shift() || {};

  internals.formatOptions(options);

  self.on('ready', function () {

    var cursor = collection.find(selector, options.projection);

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
