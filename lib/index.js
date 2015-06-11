import {Database} from './database';
import Model from './model';

export var database;

export var connect = url => {
  // Set the default database to a new instance
  database = new Database(url);
};

export var disconnect = () => {
  // Close the default database
  exports.database.disconnect();
  exports.database = undefined;
};

export {Database, Model};
export {ObjectId as Id} from 'mongodb';
