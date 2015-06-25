import _ from 'lodash';
import Assert from 'assert';

export function index() {

  if (!this._indexes) { this._indexes = {}; }

  var args = _.toArray(arguments);
  var keys = args.shift();
  var options = args.shift() || {};
  var callback = Assert.ifError;

  // TODO: figure our what `createIndex` returns and implement the callback for this method
  // if (_.isFunction(_.last(args))) {
  //  callback = args.pop();
  // }

  if (_.isString(keys)) { keys = [keys]; }
  if (_.isArray(keys)) {
    keys = (() => {

      var keysObject = {};
      keys.forEach(key => keysObject[key] = 1);
      return keysObject;
    })();
  }

  _.defaults(options, { unique: true });

  // Add key to both self and database
  Object.keys(keys).forEach(key => this._indexes[key] = options);
  this.on('ready', () => this._collection.createIndex(keys, options, callback));
}

export function dropIndexes(callback) {

  this._indexes = {};
  this.on('ready', () => this._collection.dropAllIndexes(callback));
}
