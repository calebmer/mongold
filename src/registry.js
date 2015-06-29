var internals = {};
internals.store = {};

var Registry = {
  add: model => internals.store[model._name] = model,
  remove: name => delete internals.store[name],
  exists: name => internals.store[name] ? true : false,
  get: name => internals.store[name]
};

export default Registry;
