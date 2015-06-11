import * as Mongold from '../lib';

var internals = {};
internals.url = 'mongodb://localhost:27017/mongold-test';

describe('Database', () => {

  it('can connect and disconnect', done => {

    var database = new Mongold.Database(internals.url);
    database.on('close', done);
    database.disconnect();
  });

  it('can connect and disconnect using the shortcut', done => {

    Mongold.connect(internals.url);
    Mongold.database.on('close', done);
    Mongold.disconnect();
  });
});
