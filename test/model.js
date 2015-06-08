var Assert = require('assert');
var Async = require('async');
var MongoClient = require('mongodb').MongoClient;
var Mongold = require('../lib');
var url = 'mongodb://localhost:27017/mongold-test';

describe('Model', function () {

  var collectionName = 'misc';

  var vanilla = {};
  var chocolate = {};

  before(function (done) {

    MongoClient.connect(url, function (error, db) {

      Assert.ifError(error);
      vanilla.db = db;
      vanilla.Misc = db.collection(collectionName);
      done();
    });
  });

  before(function (done) {

    chocolate.database = new Mongold.Database(url);
    chocolate.Misc = new Mongold.Model(collectionName, chocolate.database);
    chocolate.database.on('ready', function () { done(); });
  });

  after(function () { vanilla.db.close(); });
  after(function () { chocolate.database.disconnect(); });


  it('requires a database', function () {
    /* eslint-disable */
    Assert.throws(function () { new Mongold.Model('model', undefined); }, /require(.*)database/i);
    new Mongold.Model('model', chocolate.database);
    /* eslint-enable */
  });

  it('can use the default database', function () {
    /* eslint-disable */
    Mongold.connect(url);
    new Mongold.Model('model');
    Mongold.disconnect(url);
    /* eslint-enable */
  });

  it('can insert a document');
  it('can update a document');
  it('can remove a document');
  it('can find documents');
});
