'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var database = (0, _debug2['default'])('mongold:database');
exports.database = database;
var model = (0, _debug2['default'])('mongold:model');
exports.model = model;