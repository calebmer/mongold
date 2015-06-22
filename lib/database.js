import * as Debug from './debug';
import {whenReady} from './utils';
import {EventEmitter} from 'events';
import {MongoClient} from 'mongodb';

class Database extends EventEmitter {
  constructor(url) {
    super();
    whenReady(this);

    this._url = url;

    MongoClient.connect(url, (err, db) => {

      if (err) { throw err; }
      if (!db) { throw new Error('Connection to a database could not be established'); }

      Debug.database(`connected to ${this._url}`);

      this._connection = db;
      this.emit('ready', this._connection);
    });
  }

  disconnect() {
    this.on('ready', () => {

      this._connection.close();
      this._connection = undefined;
      this.emit('close');

      Debug.database(`disconnected from ${this._url}`);
    });
  }
}

export default Database;
