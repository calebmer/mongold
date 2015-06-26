import _ from 'lodash';
import Mongold from './index';

var internals = {};

internals.restrict = function (document, access) {
  this.schemaKeys().forEach(key => {

    var accessLevel = this.schema(key).access || 0;

    // If we have sufficent access, return
    if (access >= accessLevel) { return; }

    // Delete the value
    _.set(document, key, undefined);
  });
};

export function extend(document, extension, access = 2) {

  internals.restrict.call(this, extension, access);
  _.merge(document, extension);
}

export function format(origDocument, access = 2) {

  var document = _.cloneDeep(origDocument);
  // The id is broken when deep cloned, so set it to the true version
  document._id = origDocument._id;
  internals.restrict.call(this, document, access);

  var contextified = {
    '@context': this.context(),
    '@id': `${Mongold._host ? Mongold._host : ''}${this.location}/${document._id}`
  };

  delete document._id;

  // Add context info
  _.extend(contextified, document);
  return contextified;
}
