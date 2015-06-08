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

  beforeEach(function (done) { vanilla.Misc.remove({}, done); });

  it('requires a database', function () {
    /* eslint-disable */
    Assert.throws(function () { new Mongold.Model('model', undefined); }, /require(.*)database/i);
    new Mongold.Model('model', chocolate.database);
    /* eslint-enable */
  });

  it('can use the default database', function (done) {
    /* eslint-disable */
    Mongold.connect(url);
    Mongold.database.on('close', done);
    new Mongold.Model('model');
    Mongold.disconnect(url);
    /* eslint-enable */
  });

  describe('write operations', function () {

    it('throws for incorrectly executions', function () {

      Assert.throws(function () { chocolate.Misc.insert(); }, /document(.*)required/);
      Assert.throws(function () { chocolate.Misc.update(); }, /selector(.*)required/);
      Assert.throws(function () { chocolate.Misc.update({}); }, /modifier(.*)required/);
      Assert.throws(function () { chocolate.Misc.remove(); }, /selector(.*)required/);
    });

    it('can insert a document', function (done) {

      var document = { hello: 'world' };

      Async.waterfall([
        function (next) { chocolate.Misc.insert(document, next); },
        function (id, next) { vanilla.Misc.find({ _id: id }).toArray(next); }
      ], function (error, result) {

        Assert.ifError(error);
        Assert.equal(result[0].hello, document.hello);
        done();
      });
    });

    it('can insert multiple documents', function (done) {

      var documents = [
        { x: 2, y: 9, z: 2 },
        { i: 5, j: 6, k: 0 }
      ];

      Async.waterfall([
        function (next) { chocolate.Misc.insert(documents, next); },
        function (ids, next) {

          Assert.equal(ids.length, 2);
          Assert.ok(ids[0] instanceof Mongold.Id);

          vanilla.Misc.find({ _id: { $in: ids } }).toArray(next);
        }
      ], function (error, results) {

        Assert.ifError(error);

        Assert.equal(results.length, 2);
        Assert.equal(documents[0].x, results[0].x);
        Assert.equal(documents[0].y, results[0].y);
        Assert.equal(documents[0].z, results[0].z);
        Assert.equal(documents[1].i, results[1].i);
        Assert.equal(documents[1].j, results[1].j);
        Assert.equal(documents[1].k, results[1].k);

        done();
      });
    });

    it('can update a document', function (done) {

      var searchA = 8;
      var newB = 5;

      var documents = [
        { a: 1, b: 2 },
        { a: searchA, b: 3 },
        { a: searchA, b: 9 }
      ];

      Async.waterfall([
        function (next) { vanilla.Misc.insert(documents, next); },

        function (response, next) {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Misc.update({
            _id: response.ops[0]._id
          }, {
            $set: { b: newB }
          },
          next);
        },

        function (modified, next) {

          Assert.equal(modified, 1);

          chocolate.Misc.update({
            a: searchA
          }, {
            $set: { b: newB }
          },
          next);
        },

        function (modified, next) {

          Assert.equal(modified, 2);

          vanilla.Misc.find().toArray(next);
        }
      ], function (error, results) {

        Assert.ifError(error);
        Assert.equal(results.length, documents.length);

        // ES6: arrow function
        results.forEach(function (document) { Assert.equal(document.b, newB); });

        done();
      });
    });

    it('can remove a document', function (done) {

      var searchHello = 'world';

      var documents = [
        { hello: 'moon' },
        { hello: searchHello },
        { hello: searchHello }
      ];

      Async.waterfall([
        function (next) { vanilla.Misc.insert(documents, next); },

        function (response, next) {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Misc.remove({
            _id: response.ops[0]._id
          }, next);
        },

        function (modified, next) {

          Assert.equal(modified, 1);

          chocolate.Misc.remove({
            hello: searchHello
          }, next);
        },

        function (modified, next) {

          Assert.equal(modified, 2);

          vanilla.Misc.find().toArray(next);
        }
      ], function (error, results) {

        Assert.ifError(error);
        Assert.equal(results.length, 0);

        done();
      });
    });
  });

  describe('read operations', function () {

    it('can find documents');
  });
});
