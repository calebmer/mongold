import _ from 'lodash';
import Assert from 'assert';
import {getCallback, pointerToPath} from '../utils';

export function index() {

  var args = _.toArray(arguments);
  var callback = getCallback(args) || Assert.ifError;
  var keys = args.shift();
  var options = args.shift() || {};

  if (_.isString(keys)) { keys = { [keys]: 1 }; }
  _.defaults(options, { unique: true });

  if (options.unique) { Object.keys(keys).forEach(key => this.unique(key)); }

  keys = _.mapKeys(keys, (value, key) => pointerToPath(key));

  this.on('ready', () => this._collection.ensureIndex(keys, options, error => {

    if (error) { return callback(error); }
    callback();
  }));
}

export function dropIndexes(callback) {

  this.on('ready', () => this._collection.dropAllIndexes(callback));
}
