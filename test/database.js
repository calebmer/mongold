import Mongold, {Database} from '../src';

const URL = 'mongodb://localhost:27017/mongold-test';

describe('Database', () => {

  it('can connect and disconnect', done => {

    var database = new Database(URL);
    database.on('close', done);
    database.disconnect();
  });

  it('can connect and disconnect using the shortcut', done => {

    Mongold.connect(URL);
    Mongold.database.on('close', done);
    Mongold.disconnect();
  });
});
