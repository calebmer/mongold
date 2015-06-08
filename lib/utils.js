exports.whenReady = function (emitter) {

  var isReady = false;
  var args;

  // Wait for ready to fire then forever more we are ready
  emitter.on('ready', function () {

    isReady = true;
    args = arguments;
  });

  emitter.on('newListener', function (event, listener) {
    // If ready and ready has been called, fire the listener and remove the event
    if (event === 'ready' && isReady) {
      emitter.removeListener(event, listener);
      listener.apply({}, args);
    }
  });
};
