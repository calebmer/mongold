import _ from 'lodash';
import Mongold from '../index';

export function attachContext(attachment) {

  if (!this._context) {
    this._context = attachment;
    return;
  }

  // Should merge into arrays
  _.merge(this._context, attachment, (a, b) => {

    if (!_.isArray(a)) { a = [a]; }
    if (!_.isArray(b)) { b = [b]; }

    return a.concat(b);
  });
}

export function context() { return this._context; }
export function detachContext() { delete this._context; }

export function format(document, access = 0) {

  var origDocument = _.clone(document);
  var id = origDocument._id;

  var formattedDocument = {
    '@context': this.context(),
    '@id': `${Mongold._host ? Mongold._host : ''}${this.location}/${id}`
  };

  this.schemaKeys().forEach(key => {

    var schema = this.schema(key);
    var accessLevel = schema.access || 0;

    // If we do not have access, return
    if (access < accessLevel) { return; }

    // Set the value from the original document
    _.set(formattedDocument, key, _.get(origDocument, key));
  });

  return formattedDocument;
}
