var Mongold = require('../lib');
var url = 'mongodb://localhost:27017/mongold-test';

describe('Database', function () {

  it('can connect and disconnect', function (done) {

    var database = new Mongold.Database(url);
    database.on('close', done);
    database.disconnect();
  });

  it('can connect and disconnect using the shortcut', function (done) {

    Mongold.connect(url);
    Mongold.database.on('close', done);
    Mongold.disconnect();
  });
});
