'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

var database;

exports.database = database;
var Mongold = {
  connect: function connect(url) {
    // Set the default database to a new instance
    exports.database = database = new _database2['default'](url);
  },
  disconnect: function disconnect() {
    // Close the default database
    database.disconnect();
    exports.database = database = undefined;
  }
};

_defaults(exports, _interopRequireWildcard(_database));

var _model = require('./model');

_defaults(exports, _interopRequireWildcard(_model));

var _mongodb = require('mongodb');

Object.defineProperty(exports, 'Id', {
  enumerable: true,
  get: function get() {
    return _mongodb.ObjectId;
  }
});
exports['default'] = Mongold;