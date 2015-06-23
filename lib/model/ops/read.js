'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.find = find;
exports.findOne = findOne;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('../../utils');

var internals = {};

internals.formatOptions = function (options) {

  _lodash2['default'].defaults(options, { cursor: false });

  // Allow users to define own projection properties
  options.projection = options.projection || {};

  if (_lodash2['default'].isArray(options.include)) {
    options.include.forEach(function (property) {
      return options.projection[property] = 1;
    });
  }
  if (_lodash2['default'].isArray(options.exclude)) {
    options.exclude.forEach(function (property) {
      return options.projection[property] = 0;
    });
  }

  // Allow for prettier sort definitions
  if (options.sort) {
    options.sort = _lodash2['default'].mapValues(options.sort, function (value) {

      if (value === 'asc' || value === 'ascending') {
        return 1;
      }
      if (value === 'desc' || value === 'descending') {
        return -1;
      }
      return value;
    });
  }
};

function find() {
  var _this = this;

  var args = _lodash2['default'].toArray(arguments);
  var callback = (0, _utils.getCallback)(args) || _assert2['default'].ifError;

  var selector = args.shift() || {};
  var options = args.shift() || {};

  internals.formatOptions(options);

  this.on('ready', function () {

    var cursor = _this._collection.find(selector, options.projection);

    if (options.sort) {
      cursor.sort(options.sort);
    }
    if (options.skip) {
      cursor.skip(options.skip);
    }
    if (options.limit) {
      cursor.limit(options.limit);
    }

    // If the user wants the cursor
    if (options.cursor) {
      callback(null, cursor);
    }

    cursor.toArray(callback);
  });
}

function findOne() {

  var args = _lodash2['default'].toArray(arguments);
  var callback = (0, _utils.getCallback)(args) || _assert2['default'].ifError;

  var selector = args.shift() || {};
  var options = args.shift() || {};

  _lodash2['default'].extend(options, { limit: 1 });

  this.find(selector, options, function (error, documents) {
    return callback(error, documents[0]);
  });
}