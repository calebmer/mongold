import _ from 'lodash';
import Assert from 'assert';
import {ObjectID} from 'mongodb';
import {getCallback} from './utils';
import Registry from './registry';
import Model from './model';

var internals = {};
internals.breakdownArgs = function (args) {

  // console.log(args);
  var callback = _.once(getCallback(args) || Assert.ifError);
  var model = args.shift();
  var selector = args.shift() || {};
  var options = args.shift() || {};

  if (_.isString(model)) { model = Registry.get(model); }
  if (!model) { throw new Error('Model is required'); }

  return {callback, model, selector, options};
};

var Graph = {
  linkData: function (document, onJoin) {

    if (!document._id) { throw new Error('Document must have an id to be linked'); }
    if (!(document.constructor instanceof Model)) { throw new Error('Document must have been constructed by a model'); }
    var linked = {};
    // `@id` should never be overriden, so we define it this way
    linked = { '@id': `/${document.constructor._name}/${document._id}` };
    _.extend(linked, document);
    _.each(document.constructor._joins, (modelName, property) => {

      var joinedId = _.get(document, property);
      var model = Registry.get(modelName);

      if (joinedId && joinedId instanceof ObjectID) {
        _.set(linked, property, { '@id': `/${modelName}/${joinedId}` });
      }
      // If a client defined a callback, call it!
      if (onJoin) { onJoin(model, joinedId); }
    });
    // We do not need the `_id` property anymore
    delete linked._id;
    return linked;
  },
  fetch: function () {
    // All documents pushed to graph should be restricted and linked
    var graph = [];
    var waitingOn = 0;
    var {model, selector, options, callback} = internals.breakdownArgs(_.toArray(arguments));

    _.defaults(options, {
      limit: 32,
      access: 0
    });

    // Decrement `waitingOn` and run callback when done
    var next = error => {

      if (error) { return callback(error); }
      if (waitingOn <= 0) { return undefined; }

      waitingOn--;
      if (waitingOn === 0) {
        // Done, call the callback
        callback(null, graph);
      }
    };

    // Add document to the graph, check for joins, and run `next` to decrement `waitingOn`
    var graphData = document => {

      document.restrict(options.access);
      document = Graph.linkData(document, (joinModel, id) => {
        // Increment `waitingOn` because we have a new document to find
        waitingOn++;
        joinModel.findOne({ _id: id }, { terse: true }, (error, joinedDocument) => {

          if (error) { return next(error); }
          if (!joinedDocument) { return next(); }
          joinedDocument.restrict(0);
          graphData(joinedDocument);
        });
      });

      graph.push(document);
      next();
    };

    // Find all our stuffs and add them to the graph
    model.find(selector, options, (error, documents) => {

      if (error) { return callback(error); }
      // We have to wait for all of the documents to finish
      waitingOn += documents.length + 1;
      documents.forEach(graphData);
      next();
    });
  },
  fetchOne: function () {

    var {model, selector, options, callback} = internals.breakdownArgs(_.toArray(arguments));
    var documentId = selector;

    // console.log(documentId);
    if (!(documentId && documentId instanceof ObjectID)) { throw new Error('A document id is required to fetch one document'); }
    _.extend(options, { limit: 1 });

    Graph.fetch(model, { _id: documentId }, options, callback);
  }
};

export default Graph;
