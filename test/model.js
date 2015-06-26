import * as _ from 'lodash';
import * as Assert from 'assert';
import * as Async from 'async';
import Mongold, {Database, Model, Id} from '../src';
import {MongoClient} from 'mongodb';

const URL = 'mongodb://localhost:27017/mongold-test';
const COLLECTION_NAME = 'misc';

describe('Model', () => {

  var vanilla = {};
  var chocolate = {};

  before(done => {

    MongoClient.connect(URL, (error, db) => {

      Assert.ifError(error);
      vanilla.db = db;
      vanilla.Test = db.collection(COLLECTION_NAME);
      done();
    });
  });

  before(done => {

    chocolate.database = new Database(URL);
    chocolate.Test = new Model(COLLECTION_NAME, chocolate.database);
    chocolate.database.on('ready', () => done());
  });

  after(done => vanilla.Test.remove({}, done));
  after(() => vanilla.db.close());
  after(() => chocolate.database.disconnect());

  afterEach(done => {

    chocolate.Test.detachSchema();
    chocolate.Test.dropIndexes(done);
  });

  it('requires a database', () => {
    /* eslint-disable */
    Assert.throws(() => new Model('model', undefined), /require(.*)database/i);
    new Model('model', chocolate.database);
    /* eslint-enable */
  });

  it('can use the default database', done => {
    /* eslint-disable */
    Mongold.connect(URL);
    Mongold.database.on('close', done);
    new Model('model');
    Mongold.disconnect();
    /* eslint-enable */
  });

  it('can add indexes', done => {

    chocolate.Test.index('a');
    chocolate.Test.index(['b', 'c']);
    chocolate.Test.index({ d: 1, e: -1 });

    vanilla.Test.indexInformation((error, result) => {

      Assert.ifError(error);

      Assert.equal(result.a_1[0][0], 'a');
      Assert.equal(result.a_1[0][1], 1);
      Assert.equal(result.b_1_c_1[0][0], 'b');
      Assert.equal(result.b_1_c_1[0][1], 1);
      Assert.equal(result.b_1_c_1[1][0], 'c');
      Assert.equal(result.b_1_c_1[1][1], 1);
      Assert.equal(result['d_1_e_-1'][0][0], 'd');
      Assert.equal(result['d_1_e_-1'][0][1], 1);
      Assert.equal(result['d_1_e_-1'][1][0], 'e');
      Assert.equal(result['d_1_e_-1'][1][1], -1);

      done();
    });
  });

  it('can validate asynchronously', done => {

    chocolate.Test.index('a');
    chocolate.Test.index('c', { unique: false });
    chocolate.Test.attachSchema({
      'type': 'object',
      'required': ['b']
    });

    var badDocument = { a: 1, c: 3 };
    var document = { a: 1, b: 2, c: 3 };

    Async.waterfall([
      next => chocolate.Test.validate(document, next),
      (validationErrors, next) => {

        Assert.ok(_.isArray(validationErrors));
        Assert.equal(validationErrors.length, 0);
        next();
      },
      next => vanilla.Test.insert(document, next),
      (id, next) => chocolate.Test.validate(badDocument, next),
      (validationErrors, next) => {

        Assert.ok(_.isArray(validationErrors));
        Assert.equal(validationErrors.length, 2);
        Assert.equal(validationErrors[0].field, 'data.b');
        Assert.equal(validationErrors[0].message, 'is required');
        Assert.equal(validationErrors[1].field, 'data.a');
        Assert.equal(validationErrors[1].message, 'is not unique');
        next();
      },
      next => chocolate.Test.validate(badDocument, { greedy: false }, next),
      (validationError, next) => {

        Assert.ok(!_.isArray(validationError));
        Assert.equal(validationError.field, 'data.b');
        Assert.equal(validationError.message, 'is required');
        next();
      }
    ], done);
  });

  describe('write operations', () => {

    beforeEach(done => vanilla.Test.remove({}, done));

    it('throws when incorrectly executed', () => {

      Assert.throws(() => chocolate.Test.insert(), /document(.*)required/);
      Assert.throws(() => chocolate.Test.save(), /document(.*)required/);
      Assert.throws(() => chocolate.Test.update(), /selector(.*)required/);
      Assert.throws(() => chocolate.Test.update({}), /modifier(.*)required/);
    });

    it('can insert a document', done => {

      var document = { hello: 'world' };

      Async.waterfall([
        next => chocolate.Test.insert(document, next),
        (id, next) => vanilla.Test.find({ _id: id }).toArray(next)
      ], (error, result) => {

        Assert.ifError(error);
        Assert.equal(result[0].hello, document.hello);
        done();
      });
    });

    it('can insert multiple documents', done => {

      var documents = [
        { x: 2, y: 9, z: 2 },
        { i: 5, j: 6, k: 0 }
      ];

      Async.waterfall([
        next => chocolate.Test.insert(documents, next),

        (ids, next) => {

          Assert.equal(ids.length, 2);
          Assert.ok(ids[0] instanceof Id);

          vanilla.Test.find({ _id: { $in: ids } }).toArray(next);
        }
      ], (error, results) => {

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

    it('can save a document', done => {

      var newHello = 'world';
      var document = {
        world: 'hello',
        hello: 'moon'
      };

      Async.waterfall([
        next => chocolate.Test.save(document, next),

        (id, next) => {

          Assert.ok(id);
          document._id = id;
          document.hello = newHello;
          chocolate.Test.save(document, next);
        },

        (id, next) => vanilla.Test.find({ _id: id }).toArray(next)
      ], (error, results) => {

        Assert.ifError(error);

        Assert.equal(results.length, 1);
        Assert.equal(results[0].hello, newHello);
        Assert.equal(results[0].world, 'hello');

        done();
      });
    });

    it('validates on insert and save operations');
    it('validation on save and insert operations can be disabled');

    it('can update a document', done => {

      var searchA = 8;
      var newB = 5;

      var documents = [
        { a: 1, b: 2 },
        { a: searchA, b: 3 },
        { a: searchA, b: 9 }
      ];

      Async.waterfall([
        next => vanilla.Test.insert(documents, next),

        (response, next) => {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Test.update({
            _id: response.ops[0]._id
          }, {
            $set: { b: newB }
          },
          next);
        },

        (modified, next) => {

          Assert.equal(modified, 1);

          chocolate.Test.update({
            a: searchA
          }, {
            $set: { b: newB }
          },
          next);
        },

        (modified, next) => {

          Assert.equal(modified, 2);

          vanilla.Test.find().toArray(next);
        }
      ], (error, results) => {

        Assert.ifError(error);
        Assert.equal(results.length, documents.length);

        // ES6: arrow function
        results.forEach(document => Assert.equal(document.b, newB));

        done();
      });
    });

    it('can remove a document', done => {

      var searchHello = 'world';

      var documents = [
        { hello: 'moon' },
        { hello: searchHello },
        { hello: searchHello }
      ];

      Async.waterfall([
        next => vanilla.Test.insert(documents, next),

        (response, next) => {

          Assert.ok(response.result.ok);
          Assert.equal(response.ops.length, 3);

          chocolate.Test.remove({
            _id: response.ops[0]._id
          }, next);
        },

        (modified, next) => {

          Assert.equal(modified, 1);

          chocolate.Test.remove({
            hello: searchHello
          }, next);
        },

        (modified, next) => {

          Assert.equal(modified, 2);

          vanilla.Test.find().toArray(next);
        }
      ], (error, results) => {

        Assert.ifError(error);
        Assert.equal(results.length, 0);

        done();
      });
    });
  });

  describe('read operations', () => {

    var documents = [
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 4, y: 2 },
      { x: 5, y: 1 }
    ];

    before(done => vanilla.Test.insert(_.cloneDeep(documents), done));

    var readTest = (find, doAssert) => {

      return done => {

        find((error, results) => {

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
      next => chocolate.Test.find(next),
      results => {

        Assert.equal(results.length, documents.length);
        documents.forEach((document, index) => Assert.equal(document.x, results[index].x));
      }
    ));

    it('can find one document', readTest(
      next => chocolate.Test.findOne({ x: 2 }, next),
      document => {

        Assert.ok(!_.isArray(document));
        delete document._id;
        Assert.equal(JSON.stringify(document), JSON.stringify(documents[1]));
      }
    ));

    it('returns a constructed object', readTest(
      next => chocolate.Test.find(next),
      results => {

        Assert.equal(results.length, documents.length);
        results.forEach(document => Assert.ok(document instanceof chocolate.Test));
      }
    ));

    it('can find documents with a selector', readTest(
      next => chocolate.Test.find({ x: { $gt: 3 } }, next),
      results => {

        Assert.equal(results.length, 2);
        results.forEach(result => Assert.ok(result.x > 3));
      }
    ));

    it('can exclude properties with shorthand', readTest(
      next => chocolate.Test.find({}, { exclude: ['x'] }, next),
      results => {

        Assert.equal(results.length, documents.length);
        results.forEach(result => {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can include properties with shorthand', readTest(
      next => chocolate.Test.find({}, { include: ['y'] }, next),
      results => {

        Assert.equal(results.length, documents.length);
        results.forEach(result => {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can set included/excluded properties without the shorthand', readTest(
      next => chocolate.Test.find({}, { projection: { x: 0 } }, next),
      results => {

        Assert.equal(results.length, documents.length);
        results.forEach(result => {

          Assert.ok(!result.x);
          Assert.ok(result.y);
        });
      }
    ));

    it('can sort documents with the shorthand', readTest(
      next => chocolate.Test.find({}, { sort: { x: 'desc' } }, next),
      results => {

        Assert.equal(results.length, documents.length);

        var lastValue;
        results.forEach(result => {

          if (!lastValue) {
            lastValue = result.x;
            return;
          }

          Assert.ok(result.x < lastValue);
        });
      }
    ));

    it('can sort documents without the shorthand', readTest(
      next => chocolate.Test.find({}, { sort: { x: -1 } }, next),
      results => {

        Assert.equal(results.length, documents.length);

        var lastValue;
        results.forEach(result => {

          if (!lastValue) {
            lastValue = result.x;
            return;
          }

          Assert.ok(result.x < lastValue);
        });
      }
    ));

    it('can skip documents', readTest(
      next => chocolate.Test.find({}, { skip: 2 }, next),
      results => {

        Assert.equal(results.length, 3);
        results.forEach(result => Assert.ok(result.x > 2));
      }
    ));

    it('can limit documents', readTest(
      next => chocolate.Test.find({}, { limit: 2 }, next),
      results => {

        Assert.equal(results.length, 2);
        results.forEach(result => Assert.ok(result.x < 3));
      }
    ));
  });

  describe('Document', () => {

    it('is a constructor function', () => {

      Assert.ok(_.isFunction(chocolate.Test));
      Assert.ok(_.keys(chocolate.Test.prototype).length === 0);

      // Test the prototype chain
      // EventEmitter won't work, @see ../lib/model/index.js
      Assert.ok(chocolate.Test instanceof Model);
      Assert.ok(chocolate.Test instanceof Function);
      Assert.ok(chocolate.Test instanceof Object);
    });

    it('is correctly inherited', () => {

      var test = new chocolate.Test({});

      // Test the prototype chain
      Assert.ok(test instanceof chocolate.Test);
      Assert.ok(test instanceof Object);
    });

    it('can have its prototype customized', () => {

      chocolate.Test.prototype.toString = function () { return `(${this.x}, ${this.y})`; };

      var test = new chocolate.Test({ x: 5, y: 3 });

      Assert.ok(!test.hasOwnProperty('toString'));
      Assert.equal(test.toString(), '(5, 3)');

      delete chocolate.Test.prototype.toString;
    });

    it('validates on save', () => {

      chocolate.Test.attachSchema({
        'type': 'object',
        'properties': {
          'x': {
            'type': 'number'
          }
        }
      });

      var document = new chocolate.Test({ x: 2 });

      // Passes validation on construction
      document.x = 'hello';

      Assert.throws(() => { document.save(); }, /failed(.*)validation(.*)data\.x/);
      chocolate.Test.detachSchema();
    });

    it('can save a document', done => {

      var document = new chocolate.Test({ x: 5 });

      var id1;
      var id2;

      var testDocumentExists = function (documents) {

        Assert.equal(documents.length, 1);
        Assert.equal(documents[0]._id.toString(), document._id.toString());
        Assert.equal(documents[0].x, document.x);
      };

      Async.waterfall([
        next => document.save(next),
        (id, next) => {

          id1 = id;

          vanilla.Test.find({ _id: id }).toArray(next);
        },
        (documents, next) => {

          testDocumentExists(documents);

          document.x = 7;
          document.save(next);
        },
        (id, next) => {

          id2 = id;

          vanilla.Test.find({ _id: id }).toArray(next);
        }
      ], (error, documents) => {

        Assert.ifError(error);

        testDocumentExists(documents);
        Assert.equal(id1, id2);
        done();
      });
    });
  });
});
