import _ from 'lodash';

export function restrict(document, access) {

  this.properties().forEach(key => {

    var accessLevel = this.schema(key).access || 0;
    // If we have sufficent access, return
    if (access >= accessLevel) { return; }
    // Else delete the value
    _.set(document, key, undefined);
  });
}
