var _ = require('lodash');
var Assert = require('assert');
var Mongold = require('../lib');
var url = 'mongodb://localhost:27017/mongold-test';

describe('Schema', function () {

  var schemas = {
    coord: {
      'type': 'object',
      'required': ['x'],
      'properties': {
        'x': { 'type': 'number' },
        'y': { 'type': 'number' }
      }
    },
    coordPlus: {
      'type': 'object',
      'required': ['z'],
      'properties': {
        'z': { 'type': 'number' }
      }
    }
  };

  var database;
  var Test;

  before(function (done) {

    database = new Mongold.Database(url);
    Test = new Mongold.Model('test', database);
    database.on('ready', function () { done(); });
  });

  // ES6: arrow function
  after(function () { database.disconnect(); });

  // ES6: arrow function
  beforeEach(function () { Test.detachSchema(); });
  beforeEach(function (done) { Test.remove(done); });

  // ES6: arrow function
  it('can attach a schema', function () { Test.attachSchema(schemas.coord); });

  it('get attached schema', function () {

    Test.attachSchema(schemas.coord);
    Assert.ok(_.isEqual(Test.schema(), schemas.coord));
  });

  it('can remove schema', function () {

    Test.attachSchema(schemas.coord);
    Test.detachSchema();
    Assert.ok(_.isEqual(Test.schema(), {}));
  });

  it('can attach and get multiple schemas', function () {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    var schema = Test.schema();
    var mergedArray = schemas.coord.required.concat(schemas.coordPlus.required);
    Assert.equal(schema.type, schemas.coordPlus.type);
    Assert.equal(schema.required[0], mergedArray[0]);
    Assert.equal(schema.required[1], mergedArray[1]);
    Assert.ok(_.isEqual(schema.properties.x, schemas.coord.properties.x));
    Assert.ok(_.isEqual(schema.properties.y, schemas.coord.properties.y));
    Assert.ok(_.isEqual(schema.properties.z, schemas.coordPlus.properties.z));
  });

  // ES6: arrow function
  it('can check without a schema', function () { Test.check({}); });

  it('can check against a schema', function () {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    Assert.throws(function () { Test.check({}); }, /failed(.*)validation(.*)data\.x/);
  });

  // ES6: arrow function
  it('can validate without a schema', function () {

    var errors = Test.validate({});
    Assert.ok(_.isArray(errors));
    Assert.equal(errors.length, 0);
  });

  it('can get errors from a schema validation', function () {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    var errors = Test.validate({ y: 'hello' });
    Assert.ok(_.isArray(errors));
    Assert.equal(errors.length, 3);
    Assert.equal(errors[0].field, 'data.x');
    Assert.equal(errors[1].field, 'data.z');
    Assert.equal(errors[2].field, 'data.y');
    Assert.equal(errors[0].message, 'is required');
    Assert.equal(errors[1].message, 'is required');
    Assert.equal(errors[2].message, 'is the wrong type');
  });

  it('can get errors from a schema validation non greedily', function () {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    var error = Test.validate({ y: 'hello' }, false);
    Assert.ok(!_.isArray(error));
    Assert.equal(error.field, 'data.x');
    Assert.equal(error.message, 'is required');
  });

  describe('Document', function () {

    var Coord;

    before(function () {

      Coord = new Mongold.Model('coord', database);
      Coord.attachSchema(schemas.coord);
      Coord.attachSchema(schemas.coordPlus);
    });

    it('checks every document on construction', function () {
      /* eslint-disable */
      new Coord({ x: 5, y: 2, z: 3 });
      Assert.throws(function () { new Coord({}); }, /failed(.*)validation(.*)data\.x/);
      /* eslint-enable */
    });

    it('can check itself', function () {

      var coord = new Coord({ x: 5, y: 2, z: 3 });
      coord.z = 'hello';
      Assert.throws(function () { coord.check(); }, /failed(.*)validation(.*)data\.z/);
    });

    it('can validate itself', function () {

      var coord = new Coord({ x: 5, y: 2, z: 3 });
      delete coord.x;
      coord.z = 'hello';
      var errors = coord.validate();
      Assert.ok(_.isArray(errors));
      Assert.equal(errors.length, 2);
      Assert.equal(errors[0].field, 'data.x');
      Assert.equal(errors[1].field, 'data.z');
      var error = coord.validate(false);
      Assert.ok(!_.isArray(error));
      Assert.equal(error.field, 'data.x');
    });
  });
});
