'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _debug = require('./debug');

var Debug = _interopRequireWildcard(_debug);

var _utils = require('./utils');

var _events = require('events');

var _mongodb = require('mongodb');

var Database = (function (_EventEmitter) {
  function Database(url) {
    var _this = this;

    _classCallCheck(this, Database);

    _get(Object.getPrototypeOf(Database.prototype), 'constructor', this).call(this);
    (0, _utils.whenReady)(this);

    this._url = url;

    _mongodb.MongoClient.connect(url, function (err, db) {

      if (err) {
        throw err;
      }
      if (!db) {
        throw new Error('Connection to a database could not be established');
      }

      Debug.database('connected to ' + _this._url);

      _this._connection = db;
      _this.emit('ready', _this._connection);
    });
  }

  _inherits(Database, _EventEmitter);

  _createClass(Database, [{
    key: 'disconnect',
    value: function disconnect() {
      var _this2 = this;

      this.on('ready', function () {

        _this2._connection.close();
        _this2._connection = undefined;
        _this2.emit('close');

        Debug.database('disconnected from ' + _this2._url);
      });
    }
  }]);

  return Database;
})(_events.EventEmitter);

exports['default'] = Database;
module.exports = exports['default'];