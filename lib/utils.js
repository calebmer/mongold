exports.whenReady = function (emitter) {

  var isReady = false;

  // Wait for ready to fire then forever more we are ready
  emitter.on('ready', function () { isReady = true; });

  emitter.on('newListener', function (event, listener) {
    // If ready and ready has been called, fire the listener and remove the event
    if (event === 'ready' && isReady) {
      emitter.removeListener(event, listener);
      listener();
    }
  });
};
