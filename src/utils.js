import _ from 'lodash';

export function whenReady(emitter) {

  var isReady = false;
  var args;

  // Wait for ready to fire then forever more we are ready
  emitter.on('ready', () => {
    isReady = true;
    args = arguments;
  });

  emitter.on('newListener', (event, listener) => {
    // If ready and ready has been called, fire the listener and remove the event
    if (event === 'ready' && isReady) {
      // Wait until the next tick, at this moment the listener may not be added
      process.nextTick(() => emitter.removeListener(event, listener));
      listener.apply({}, args);
    }
  });
}

export function getCallback(args) {

  if (_.isFunction(_.last(args))) {
    return args.pop();
  }
}

export var pointerToPath = pointer => pointer.replace(/^\//, '').replace(/\//, '.');
