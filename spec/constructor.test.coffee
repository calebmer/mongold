describe 'the document constructor', ->


  it 'is a constructor function', ->
    Object.keys( Test.b.prototype ).length.should.be.exactly 0
    Test.b.should.be.an.instanceof Model
    Test.b.should.be.an.instanceof Function


  it 'instantiates documents correctly', -> (new Test.b()).should.be.an.instanceof Test.b


  it 'checks every document on construction', ->
    Test.b.attachSchema
      required: ['y']
    errored = false
    try new Test.b x: 5
    catch
      errored = true
    errored.should.be.ok()
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