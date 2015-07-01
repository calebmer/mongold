import _ from 'lodash';
import Pointer from 'json-pointer';

export function access(level, pointers) {

  if (!_.isArray(pointers)) { pointers = [pointers]; }
  if (!this._access) { this._access = []; }
  if (!this._access[level]) { this._access[level] = []; }

  this._access[level] = this._access[level].concat(pointers);
}

export function restrict(document, level = 0) {

  if (!this._access) { return; }

  this._access.forEach((pointers, index) => {

    // For these levels we are authorized
    if (index <= level) { return; }

    pointers.forEach(pointer => Pointer.remove(document, pointer));
  });
}
