import _ from 'lodash';
import Assert from 'assert';

var internals = {};

internals.writeAction = action => {

  return function () {

    var args = _.toArray(arguments);
    var collection = this._collection;
    var callback = Assert.ifError;
    var hasCallback = false;
    var formatResponse;

    if (_.isFunction(_.last(args))) {
      callback = args.pop();
      hasCallback = true;
    }

    var document;
    var selector;
    var modifier;
    var options;

    if (action === 'insert' || action === 'save') {
      document = args.shift();

      if (!document || !_.isObject(document)) {
        return callback(new Error('A document object is required'));
      }
    }

    if (action === 'update' || action === 'remove') {
      selector = args.shift();

      if (!selector || !_.isObject(selector)) {
        if (action === 'update') {
          return callback(new Error('A selector object is required'));
        } else {
          selector = {};
        }
      }

      if (action === 'update') {
        modifier = args.shift();

        if (!modifier || !_.isObject(modifier)) {
          return callback(new Error('A modifier object is required'));
        }

        // TODO: Maybe validate the modifier?
      }
    }

    options = args.shift() || {};

    _.defaults(options, {
      validate: true,
      writeConcern: {
        w: hasCallback ? 1 : 0
      }
    });

    if (document && options.validate) {
      document = this.clean(document);

      // Validate the document
      // If there is an error, use the callback
      try {
        this.check(document);
      } catch (error) {
        return callback(error);
      }
    }

    callback = _.wrap(callback, (next, error, response) => {

      if (error) { return next(error); }

      if (response.result.ok !== 1) {
        return next(new Error(`Database '${action}' operation failed`));
      }

      next(null, formatResponse(response));
    });

    this.on('ready', () => {

      if (action === 'insert' || action === 'save') {
        // Return the id (or array of ids) as the response
        formatResponse = response => {
          // If the document has an id and there are no ops documents, just return the id
          if (document._id && (!response.ops || response.ops.length === 0)) {
            return document._id;
          }

          if (!_.isArray(document)) {
            return response.ops[0]._id;
          }

          return _.map(response.ops, op => op._id);
        };

        if (action === 'save') {
          return collection.save(document, options, callback);
        }

        return collection.insert(document, options, callback);
      }

      if (action === 'update' || action === 'remove') {
        // ES6: arrow function
        formatResponse = response => response.result.n;

        // If this is the remove action, fire and don't continue
        if (action === 'remove') {
          _.defaults(options, { justOne: selector._id ? true : false });
          return collection.remove(selector, callback);
        }

        _.defaults(options, { multi: selector._id ? false : true });
        return collection.update(selector, modifier, options, callback);
      }
    });
  };
};

export var insert = internals.writeAction('insert');
export var save = internals.writeAction('save');
export var update = internals.writeAction('update');
export var remove = internals.writeAction('remove');
