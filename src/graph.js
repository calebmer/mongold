import _ from 'lodash';
import Assert from 'assert';
import Async from 'async';
import {ObjectID} from 'mongodb';
import {getCallback} from './utils';
import Registry from './registry';
import Model from './model';

class Graph {
  static linkData(document) {

    if (!document._id) { throw new Error('Document must have an id to be linked'); }
    if (!(document.constructor instanceof Model)) { throw new Error('Document must have been constructed by a model'); }
    var linked = {};
    // `@id` should never be overriden, so we define it this way
    linked = { '@id': `/${document.constructor._name}/${document._id}` };
    _.extend(linked, document);
    _.each(document.constructor._joins, (modelName, property) => {

      var joinedId = _.get(document, property);
      if (joinedId && joinedId instanceof ObjectID) {
        _.set(linked, property, { '@id': `/${modelName}/${joinedId}` });
      }
    });
    // We do not need the `_id` property anymore
    delete linked._id;
    return linked;
  }

  constructor(model) {

    if (_.isString(model)) {
      if (!Registry.exists(model)) { throw new Error(`Model '${model}' does not exist!`); }
      model = Registry.get(model);
    }

    this._model = model;
  }

  fetch() {
    // All documents pushed to graph should be restricted and linked
    var graph = [];
    var args = _.toArray(arguments);
    var callback = getCallback(args) || Assert.ifError;
    var selector = args.shift() || {};
    var options = args.shift() || {};

    _.defaults(options, {
      access: 0
    });

    Async.waterfall([
      done => this._model.find(selector, { limit: 32 }, done),
      (documents, done) => {
        // The start point for our graph is this data
        graph = documents.map(document => {

          document.restrict(options.access);
          return Graph.linkData(document);
        });
        // For all of our documents we must detect and apply joins
        Async.each(documents, (document, nextDocument) => {

          Async.forEachOf(this._model._joins, (modelName, property, nextJoin) => {
            // Get the join's model
            var model = Registry.get(modelName);
            // Get the id for the join
            var value = _.get(document, property);
            // If we do not have on of the two pieces, do a silent return
            if (!model || !value) { return nextJoin(); }
            // Get the document to be joined
            model.findOne({ _id: value }, (error, joinedDocument) => {

              if (error) { return nextJoin(error); }
              if (!joinedDocument) { return nextJoin(); }
              // Restrict > link > push
              joinedDocument.restrict(0);
              graph.push(Graph.linkData(joinedDocument));
              nextJoin();
            });
          }, nextDocument);
        }, done);
      },
      // The final result should return the final graph
      done => done(null, graph)
    ], callback);
  }

  fetchOne() {

    var args = _.toArray(arguments);
    var callback = getCallback(args);
    var documentId = args.shift();
    var options = args.shift();

    _.extend(options, { limit: 1 });

    this.fetch({ _id: documentId }, options, callback);
  }
}

export default Graph;
