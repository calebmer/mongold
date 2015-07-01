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

export function linkify(document, onLink) {

  var linkedDocument = {
    '@id': document.getUrl()
  };

  var dontCopy = ['/_id'];

  _.each(this._joins, (model, pointer) => {
    // If the pointed value does not exist end
    if (!Pointer.has(document, pointer)) { return; }
    var id = Pointer.get(document, pointer);

    // If the value is not an id, it is not what we want
    if (!(id instanceof ObjectId)) { return; }

    // Output the json-ld style reference
    Pointer.set(linkedDocument, pointer, { '@id': model.getUrl(id) });

    // Let's not copy that again, then call the callback
    dontCopy.push(pointer);
    onLink(model, id);
  });

  dontCopy = new RegExp('^' + dontCopy.map(pointer => _.escapeRegExp(pointer)).join('|'));

  _.each(Pointer.dict(document), (value, pointer) => {
    // We are using a bad property, don't copy
    if (dontCopy.test(pointer)) { return; }
    Pointer.set(linkedDocument, pointer, value);
  });

  return linkedDocument;
}

// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
// TODO: STREAMIFY
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

    var linkedDocument = document.linkify((model, id) => {

      // Increment waiting on
      waitingOn++;

      model.findOne({ _id: id }, (error, joinedDocument) => {

        if (error) { return next(error); }
        // If the document was not found
        if (!joinedDocument) { return next(); }
        // Run the fetch command on the new document
        fetch(joinedDocument);
      });
    });

    theGraph.push(linkedDocument);
    next();
  }

  this.find(selector, options, (error, documents) => {

    if (error) { return callback(error); }
    waitingOn += documents.length;
    documents.forEach(fetch);
  });
}
