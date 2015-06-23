'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.index = index;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function index() {
  var _this = this;

  var args = _lodash2['default'].toArray(arguments);
  var keys = args.shift();
  var options = args.shift() || {};
  var callback = _assert2['default'].ifError;

  // TODO: figure our what `createIndex` returns and implement the callback for this method
  // if (_.isFunction(_.last(args))) {
  //  callback = args.pop();
  // }

  if (_lodash2['default'].isString(keys)) {
    keys = [keys];
  }
  if (_lodash2['default'].isArray(keys)) {
    keys = (function () {

      var keysObject = {};
      keys.forEach(function (key) {
        return keysObject[key] = 1;
      });
      return keysObject;
    })();
  }

  _lodash2['default'].defaults(options, { unique: true });

  this.on('ready', function () {
    return _this._collection.createIndex(keys, options, callback);
  });
}

;