'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.attachContext = attachContext;
exports.detachContext = detachContext;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function attachContext(attachment) {

  if (!this._context) {
    this._context = attachment;
    return;
  }

  // Should merge into arrays
  _lodash2['default'].merge(this._context, attachment, function (a, b) {

    if (!_lodash2['default'].isArray(a)) {
      a = [a];
    }
    if (!_lodash2['default'].isArray(b)) {
      b = [b];
    }

    return a.concat(b);
  });
}

;

function detachContext() {
  delete this._context;
}

;