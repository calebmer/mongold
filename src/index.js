import Database from './database';
import Model from './model';

export {Database, Model};
export {ObjectId as Id} from 'mongodb';

var Mongold = {
  serverUrl: '',
  connect: function (url) {
    // Set the default database to a new instance
    this.database = new Database(url);
  },
  disconnect: function () {
    // Close the default database
    this.database.disconnect();
    delete this.database;
  }
};

export default Mongold;
