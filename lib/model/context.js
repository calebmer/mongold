import _ from 'lodash';

export var attachContext = function (attachment) {

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
};

export var detachContext = function () { delete this._context; };
