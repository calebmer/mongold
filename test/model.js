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
      vanilla.Test = db.collection(collectionName);
      done();
    });
  });

  before(function (done) {

    chocolate.database = new Mongold.Database(url);
    chocolate.Test = new Mongold.Model(collectionName, chocolate.database);
    chocolate.database.on('ready', function () { done(); });
  });

  // ES6: arrow functions
  after(function (done) { vanilla.Test.remove({}, done); });
  after(function () { vanilla.db.close(); });
  after(function () { chocolate.database.disconnect(); });

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

    // ES6: arrow function
    beforeEach(function (done) { vanilla.Test.remove({}, done); });

    it('throws when incorrectly executed', function () {

      Assert.throws(function () { chocolate.Test.insert(); }, /document(.*)required/);
      Assert.throws(function () { chocolate.Test.update(); }, /selector(.*)required/);
      Assert.throws(function () { chocolate.Test.update({}); }, /modifier(.*)required/);
    });

    it('can insert a document', function (done) {

      var document = { hello: 'world' };

      Async.waterfall([
        function (next) { chocolate.Test.insert(document, next); },
        function (id, next) { vanilla.Test.find({ _id: id }).toArray(next); }
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
        function (next) { chocolate.Test.insert(documents, next); },
        function (ids, next) {

          Assert.equal(ids.length, 2);
          Assert.ok(ids[0] instanceof Mongold.Id);

          vanilla.Test.find({ _id: { $in: ids } }).toArray(next);
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
        function (next) { vanilla.Test.insert(documents, next); },

        function (response, next) {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Test.update({
            _id: response.ops[0]._id
          }, {
            $set: { b: newB }
          },
          next);
        },

        function (modified, next) {

          Assert.equal(modified, 1);

          chocolate.Test.update({
            a: searchA
          }, {
            $set: { b: newB }
          },
          next);
        },

        function (modified, next) {

          Assert.equal(modified, 2);

          vanilla.Test.find().toArray(next);
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
        function (next) { vanilla.Test.insert(documents, next); },

        function (response, next) {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Test.remove({
            _id: response.ops[0]._id
          }, next);
        },

        function (modified, next) {

          Assert.equal(modified, 1);

          chocolate.Test.remove({
            hello: searchHello
          }, next);
        },

        function (modified, next) {

          Assert.equal(modified, 2);

          vanilla.Test.find().toArray(next);
        }
      ], function (error, results) {

        Assert.ifError(error);
        Assert.equal(results.length, 0);

        done();
      });
    });
  });

  describe('read operations', function () {

    var documents = [
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 4, y: 2 },
      { x: 5, y: 1 }
    ];

    // ES6: arrow functions
    before(function (done) { vanilla.Test.insert(documents, done); });

    var readTest = function (find, doAssert) {

      return function (done) {

        find(function (error, results) {

          Assert.ifError(error);
          doAssert(results);
          done();
        });
      };
    };

    // FIXME: this errors, why?
    // it('can return a cursor', readTest(
    //   // ES6: arrow function
    //   function (next) { chocolate.Test.find({}, { cursor: true }, next); },
    //   // ES6: arrow function
    //   function (cursor) { Assert.ok(!_.isArray(cursor)); }
    // ));

    it('can find all documents', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find(next); },
      function (results) {

        Assert.equal(results.length, documents.length);
        // ES6: arrow function
        documents.forEach(function (document, index) { Assert.equal(document.x, results[index].x); });
      }
    ));

    it('can find documents with a selector', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({ x: { $gt: 3 } }, next); },
      function (results) {

        Assert.equal(results.length, 2);
        // ES6: arrow function
        results.forEach(function (result) { Assert.ok(result.x > 3); });
      }
    ));

    it('can exclude properties with shorthand', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { exclude: ['x'] }, next); },
      function (results) {

        Assert.equal(results.length, documents.length);
        results.forEach(function (result) {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can include properties with shorthand', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { include: ['y'] }, next); },
      function (results) {

        Assert.equal(results.length, documents.length);
        results.forEach(function (result) {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can set included/excluded properties without the shorthand', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { projection: { x: 0 } }, next); },
      function (results) {

        Assert.equal(results.length, documents.length);
        results.forEach(function (result) {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can sort documents with the shorthand', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { sort: { x: 'desc' } }, next); },
      function (results) {

        Assert.equal(results.length, documents.length);

        var lastValue;
        results.forEach(function (result) {

          if (!lastValue) {
            lastValue = result.x;
            return;
          }

          Assert.ok(result.x < lastValue);
        });
      }
    ));

    it('can sort documents without the shorthand', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { sort: { x: -1 } }, next); },
      function (results) {

        Assert.equal(results.length, documents.length);

        var lastValue;
        results.forEach(function (result) {

          if (!lastValue) {
            lastValue = result.x;
            return;
          }

          Assert.ok(result.x < lastValue);
        });
      }
    ));

    it('can skip documents', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { skip: 2 }, next); },
      function (results) {

        Assert.equal(results.length, 3);
        results.forEach(function (result) { Assert.ok(result.x > 2); });
      }
    ));

    it('can limit documents', readTest(
      // ES6: arrow function
      function (next) { chocolate.Test.find({}, { limit: 2 }, next); },
      function (results) {

        Assert.equal(results.length, 2);
        results.forEach(function (result) { Assert.ok(result.x < 3); });
      }
    ));
  });
});
