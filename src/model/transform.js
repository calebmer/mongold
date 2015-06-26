import _ from 'lodash';
import Mongold from './index';

var internals = {};

internals.restrict = function (document, access) {
  // Save the id
  var id = document._id;

  this.schemaKeys().forEach(key => {

    var accessLevel = this.schema(key).access || 0;

    // If we have sufficent access, return
    if (access >= accessLevel) { return; }

    // Delete the value
    _.set(document, key, undefined);
  });

  // Reset the it, just in case it was removed
  document._id = id;
};

export function extend(document, extension, access = 2) {

  internals.restrict.call(this, extension, access);
  _.merge(document, extension);
}

export function format(origDocument, access = 2) {

  var id = origDocument._id;

  var document = _.cloneDeep(origDocument);
  internals.restrict.call(this, document, access);

  delete document._id;

  var contextified = {
    '@context': this.context(),
    '@id': `${Mongold._host ? Mongold._host : ''}${this.location}/${id}`
  };

  // Add context info
  _.extend(contextified, document);
  return contextified;
}
