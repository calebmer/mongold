import _ from 'lodash';
import Assert from 'assert';

export function index() {

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

  this.on('ready', () => this._collection.createIndex(keys, options, callback));
};