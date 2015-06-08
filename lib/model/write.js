var _ = require('lodash');
var Assert = require('assert');

['insert', 'update', 'remove'].forEach(function (action) {

  exports[action] = function () {

    var self = this;
    var args = _.toArray(arguments);
    var collection = self._collection;
    var callback = Assert.ifError;
    var hasCallback = false;

    if (_.isFunction(_.last(args))) {
      callback = args.pop();
      hasCallback = true;
    }

    // ES6: arrow function
    var formatResponse = function () { return null; };

    callback = _.wrap(callback, function (next, error, response) {

      if (error) { return next(error); }

      if (response.result.ok !== 1) {
        // ES6: template string
        return next(new Error('Database \'' + action + '\' operation failed'));
      }

      next(null, formatResponse(response));
    });

    self.on('ready', function () {

      if (action === 'insert') {
        var document = args.shift();

        if (!document || !_.isObject(document)) {
          return callback(new Error('A document object is required'));
        }

        // Return the id (or array of ids) as the response
        formatResponse = function (response) {

          var result;
          // ES6: arrow function
          var transform = function (op) { return op._id; };

          if (!_.isArray(document)) {
            result = transform(response.ops[0]);
          } else {
            result = _.map(response.ops, transform);
          }

          return result;
        };

        return collection.insert(document, callback);
      }

      if (action === 'update' || action === 'remove') {
        var selector = args.shift();

        if (!selector || !_.isObject(selector)) {
          return callback(new Error('A selector object is required'));
        }

        // ES6: arrow function
        formatResponse = function (response) { return response.result.n; };

        // If this is the remove action, fire and don't continue
        if (action === 'remove') {
          return collection.remove(selector, callback);
        }

        // For the update action we need a modifier
        var modifier = args.shift();

        if (!modifier || !_.isObject(modifier)) {
          return callback(new Error('A modifier object is required'));
        }

        // Allow the user the option to define their own options
        var options = args.shift() || {};

        // But we will use smart defaults
        // If the selector has an id, it is likely to not be a multi document update
        // If we do not have a callback it is likely we do not need a response from the server
        _.defaults(options, {
          multi: selector._id ? false : true,
          writeConcern: {
            w: hasCallback ? 1 : 0
          }
        });

        return collection.update(selector, modifier, options, callback);
      }
    });
  };
});
