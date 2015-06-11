var _ = require('lodash');
var Assert = require('assert');
var Mongold = require('../lib');
var url = 'mongodb://localhost:27017/mongold-test';

describe('Schema', () => {

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

  before(done => {

    database = new Mongold.Database(url);
    Test = new Mongold.Model('test', database);
    database.on('ready', () => done());
  });

  after(() => database.disconnect());

  beforeEach(() => Test.detachSchema());
  beforeEach(done => Test.remove(done));

  it('can attach a schema', () => Test.attachSchema(schemas.coord));

  it('get attached schema', () => {

    Test.attachSchema(schemas.coord);
    Assert.ok(_.isEqual(Test.schema(), schemas.coord));
  });

  it('can remove schema', () => {

    Test.attachSchema(schemas.coord);
    Test.detachSchema();
    Assert.ok(_.isEqual(Test.schema(), {}));
  });

  it('can attach and get multiple schemas', () => {

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

  it('can check without a schema', () => Test.check({}));

  it('can check against a schema', () => {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    Assert.throws(() => Test.check({}), /failed(.*)validation(.*)data\.x/);
  });

  // ES6: arrow function
  it('can validate without a schema', () => {

    var errors = Test.validate({});
    Assert.ok(_.isArray(errors));
    Assert.equal(errors.length, 0);
  });

  it('can get errors from a schema validation', () => {

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

  it('can get errors from a schema validation non greedily', () => {

    Test.attachSchema(schemas.coord);
    Test.attachSchema(schemas.coordPlus);
    var error = Test.validate({ y: 'hello' }, false);
    Assert.ok(!_.isArray(error));
    Assert.equal(error.field, 'data.x');
    Assert.equal(error.message, 'is required');
  });

  describe('Document', () => {

    var Coord;

    before(() => {

      Coord = new Mongold.Model('coord', database);
      Coord.attachSchema(schemas.coord);
      Coord.attachSchema(schemas.coordPlus);
    });

    it('checks every document on construction', () => {
      /* eslint-disable */
      new Coord({ x: 5, y: 2, z: 3 });
      Assert.throws(() => new Coord({}), /failed(.*)validation(.*)data\.x/);
      /* eslint-enable */
    });

    it('can check itself', () => {

      var coord = new Coord({ x: 5, y: 2, z: 3 });
      coord.z = 'hello';
      Assert.throws(() => coord.check(), /failed(.*)validation(.*)data\.z/);
    });

    it('can validate itself', () => {

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
