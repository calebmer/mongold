var _ = require('lodash');
var Assert = require('assert');

['insert', 'save', 'update', 'remove'].forEach(function (action) {

  exports[action] = function () {

    var self = this;
    var args = _.toArray(arguments);
    var collection = self._collection;
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

      // Validate the document
      // If there is an error, use the callback
      try {
        self.check(document);
      } catch (error) {
        return callback(error);
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
      writeConcern: {
        w: hasCallback ? 1 : 0
      }
    });

    callback = _.wrap(callback, function (next, error, response) {

      if (error) { return next(error); }

      if (response.result.ok !== 1) {
        // ES6: template string
        return next(new Error('Database \'' + action + '\' operation failed'));
      }

      next(null, formatResponse(response));
    });

    self.on('ready', function () {

      if (action === 'insert' || action === 'save') {
        // Return the id (or array of ids) as the response
        formatResponse = function (response) {
          // ES6: arrow function
          var transform = function (op) { return op._id; };
          return (function () {
            // If the document has an id and there are no ops documents, just return the id
            if (document._id && (!response.ops || response.ops.length === 0)) {
              return document._id;
            }

            if (!_.isArray(document)) {
              return transform(response.ops[0]);
            }

            return _.map(response.ops, transform);
          }());
        };

        if (action === 'insert') {
          return collection.insert(document, options, callback);
        }

        return collection.save(document, options, callback);
      }

      if (action === 'update' || action === 'remove') {
        // ES6: arrow function
        formatResponse = function (response) { return response.result.n; };

        // If this is the remove action, fire and don't continue
        if (action === 'remove') {
          _.defaults(options, {
            justOne: selector._id ? true : false
          });

          return collection.remove(selector, callback);
        }

        _.defaults(options, {
          multi: selector._id ? false : true
        });

        return collection.update(selector, modifier, options, callback);
      }
    });
  };
});
