exports.Id = require('mongodb').ObjectId;
exports.Database = require('./database');
exports.Model = require('./model');

exports.database = undefined;

exports.connect = function (url) {
  // Set the default database to a new instance
  exports.database = new exports.Database(url);
};

exports.disconnect = function () {
  // Close the default database
  exports.database.disconnect();
  exports.database = undefined;
};
