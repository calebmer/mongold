describe 'write operations', ->

  removeAll = (done) -> Test.a.remove {}, done
  before removeAll
  afterEach removeAll
  afterEach () -> Test.b.detachSchema()


  it 'can insert a document', (done) ->
    Test.b.insert hello: 'world', (e, id) ->
      done e if e?
      id.should.not.be.an.Array()
      Test.a.find( _id: id ).toArray (e, result) ->
        done e if e?
        result.should.be.an.Array()
        result[0].should.have.property 'hello', 'world'
        done()


  it 'can insert multiple documents', (done) ->
    Test.b.insert [
      {hello: 'world'}
      {world: 'hello'}
    ], (e, ids) ->
      done e if e?
      ids.should.be.an.Array().and.have.property 'length', 2
      Test.a.find( _id: { $in: ids } ).toArray (e, results) ->
        done e if e?
        results[0].hello.should.be.exactly 'world'
        results[1].world.should.be.exactly 'hello'
        done()


  it 'can save a document', (done) ->
    Test.a.insert
      hello: 'world'
      world: 'hello'
    , (e, result) ->
      done e if e?
      Test.b.save
        _id: result.ops[0]._id
        hello: 'moon'
      , (e, id) ->
        done e if e?
        id.should.be.exactly result.ops[0]._id
        Test.a.find( _id: id ).toArray (e, results) ->
          done e if e?
          results[0].hello.should.be.exactly 'moon'
          ( results[0].world == undefined ).should.be.ok()
          done()


  it 'will validate a document on insert/save', (done) ->
    Test.b.attachSchema
      required: ['a']
    Test.b.insert
      hello: 'world'
    , (e, id) ->
      e.should.be.ok()
      e.field.should.be.exactly 'data.a'
      done()


  it 'can update a document', (done) ->
    Test.a.insert
      hello: 'world'
      world: 'hello'
    , (e) ->
      done e if e?
      Test.b.update {world: 'hello'}, {$set: {hello: 'moon'}}, (e, modified) ->
        done e if e?
        Test.a.find( hello: 'moon' ).toArray (e, results) ->
          done e if e?
          results[0].should.have.property 'hello', 'moon'
          results[0].should.have.property 'world', 'hello'
          done()


  # This works because we have been removing documents after every test
  # We have also been inserting/saving documents the entire time
  it 'can remove a document', (done) ->
    Test.a.find().toArray (e, results) ->
      done e if e?
      results.should.have.property 'length', 0
      done()
