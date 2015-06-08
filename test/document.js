var _ = require('lodash');
var Assert = require('assert');
var Mongold = require('../lib');
var Document = require('../lib/document');
var url = 'mongodb://localhost:27017/mongold-test';

describe('Document', function () {

  before(function (done) {

    Mongold.connect(url);
    // ES6: arrow function
    Mongold.database.on('ready', function () { done(); });
  });

  after(function () { Mongold.disconnect(); });

  it('is a constructor function', function () {

    var Test = new Mongold.Model('test');

    Assert.ok(_.isFunction(Test));
    Assert.ok(_.keys(Test.prototype).length === 0);

    // Test the prototype chain
    // EventEmitter won't work, @see ../lib/model/index.js
    Assert.ok(Test instanceof Mongold.Model);
    Assert.ok(Test instanceof Function);
    Assert.ok(Test instanceof Object);
  });

  it('is correctly inherited', function () {

    var Test = new Mongold.Model('test');
    var test = new Test({});

    // Test the prototype chain
    Assert.ok(test instanceof Test);
    Assert.ok(test instanceof Document);
    Assert.ok(test instanceof Object);
  });

  it('can have its prototype customized', function () {

    var Test = new Mongold.Model('test');

    // ES6: template string
    Test.prototype.toString = function () { return '(' + this.x + ', ' + this.y + ')'; };

    var test = new Test({ x: 5, y: 3 });

    Assert.ok(!test.hasOwnProperty('toString'));
    Assert.equal(test.toString(), '(5, 3)');
  });
});
