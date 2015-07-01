import _ from 'lodash';
import Assert from 'assert';
import Pointer from 'json-pointer';
import {ObjectId} from 'mongodb';
import {getCallback} from '../utils';

export function join(pointer, model) {

  if (_.isObject(pointer)) {
    _.each(pointer, (m, p) => join.call(this, p, m));
    return;
  }

  // Allows the passage of a model instance
  if (!model) { throw new Error('A model is not defined'); }
  if (!this._joins) { this._joins = {}; }

  this._joins[pointer] = model;
}

export function graph() {

  var args = _.toArray(arguments);
  var callback = _.once(getCallback(args) || Assert.ifError);
  var selector = args.shift() || {};
  var options = args.shift() || {};

  var theGraph = [];
  var waitingOn = 0;

  function next(error) {

    if (error) { return callback(error); }
    waitingOn--;
    if (waitingOn === 0) {
      callback(null, theGraph);
    }
  }

  function fetch(document) {

    _.each(document.constructor._joins, (model, pointer) => {

      // Increment waiting on
      waitingOn++;

      // Get the object id, `Pointer.get` throws error if it does not exist
      if (!Pointer.has(document, pointer)) { return next(); }
      var id = Pointer.get(document, pointer);
      if (!(id instanceof ObjectId)) { return next(); }

      // Find the joined document
      model.findOne({ _id: id }, (error, joinedDocument) => {

        if (error) { return next(error); }
        // If the document was not found
        if (!joinedDocument) { return next(); }

        // Set the reference to the json-ld format
        Pointer.set(document, pointer, { '@id': joinedDocument.getUrl() });

        // Run the fetch command on the new document
        fetch(joinedDocument);
      });
    });

    document['@id'] = document.getUrl();
    delete document._id;
    theGraph.push(document);
    next();
  }

  this.find(selector, options, (error, documents) => {

    if (error) { return callback(error); }
    waitingOn += documents.length;
    documents.forEach(fetch);
  });
}
