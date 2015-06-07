var Humongo = require('../lib');
var url = 'mongodb://localhost:27017/humongo-test';

describe('Database', function () {

  it('can connect and disconnect', function (done) {

    var database = new Humongo.Database(url);
    database.on('close', done);
    database.disconnect();
  });

  it('can connect and disconnect using the shortcut', function (done) {

    Humongo.connect(url);
    Humongo.database.on('close', done);
    Humongo.disconnect();
  });
});
