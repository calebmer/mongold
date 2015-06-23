'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.whenReady = whenReady;
exports.getCallback = getCallback;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function whenReady(emitter) {
  var _arguments = arguments;

  var isReady = false;
  var args;

  // Wait for ready to fire then forever more we are ready
  emitter.on('ready', function () {
    isReady = true;
    args = _arguments;
  });

  emitter.on('newListener', function (event, listener) {
    // If ready and ready has been called, fire the listener and remove the event
    if (event === 'ready' && isReady) {
      // Wait until the next tick, at this moment the listener may not be added
      process.nextTick(function () {
        return emitter.removeListener(event, listener);
      });
      listener.apply({}, args);
    }
  });
}

function getCallback(args) {

  if (_lodash2['default'].isFunction(_lodash2['default'].last(args))) {
    return args.pop();
  }
}