describe 'the document constructor', ->


  it 'is a constructor function', ->
    Object.keys( Test.b.prototype ).length.should.be.exactly 0
    Test.b.should.be.an.instanceof Model
    Test.b.should.be.an.instanceof Function


  it 'instantiates documents correctly', -> (new Test.b()).should.be.an.instanceof Test.b


  it 'checks every document on construction', ->
    Test.b.attachSchema
      required: ['y']
    Should.throws -> new Test.b x: 5
    Test.b.detachSchema()


  it 'will clean its values on construction', ->
    Test.b.attachSchema
      type: 'object'
      additionalProperties: false
      properties:
        x: type: 'number'
        y: type: 'number'
    document = new Test.b x: 5, y: 2
    document.should.not.have.property 'z'
    Test.b.detachSchema()


  it 'will provide a saveable document', (done) ->
    document = new Test.b x: 5, y: 2
    document.save (e) ->
      done e if e?
      document.should.have.property '_id'
      done()


  it 'provides an @id property that resolves to the url', (done) ->
    document = new Test.b x: 5, y: 2
    Should( document['@id'] ).not.be.ok()
    document.save (e) ->
      done e if e?
      document['@id'].should.be.exactly '/test/' + document._id
      done()
