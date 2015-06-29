import _ from 'lodash';

export function join(property, modelName) {
  if (!_.isString(property)) {
    _.each(property, (m, p) => join.call(this, p, m));
    return;
  }

  // Allows the passage of a model instance
  if (_.isObject(modelName) && !_.isString(modelName)) {
    modelName = modelName._name;
  }

  if (!modelName) { throw new Error('A model is not defined'); }
  if (!this._joins) { this._joins = {}; }

  this._joins[property] = modelName;
}
