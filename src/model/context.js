import _ from 'lodash';

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
