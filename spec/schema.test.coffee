describe 'schema methods', ->

  schemas =
    coord:
      type: 'object'
      required: ['x']
      additionalProperties: false
      properties:
        x: type: 'number'
        y: type: 'number'
    coordPlus:
      type: 'object'
      required: ['z']
      properties:
        z: type: 'number'
    deep:
      type: 'object',
      properties:
        a:
          type: 'object'
          properties:
            b:
              type: 'object'
              properties:
                c:
                  type: 'object'
                  properties:
                    d: type: 'string'

  afterEach -> Test.b.detachSchema()
  afterEach (done) -> Test.b.remove done
  afterEach (done) -> Test.b.dropIndexes done


  it 'can attach a schema', -> Test.b.attachSchema schemas.coord


  it 'can get a schema', ->
    Test.b.attachSchema schemas.coord
    Test.b.schema().should.containDeep schemas.coord


  it 'will merge multiple schemas together', ->
    Test.b.attachSchema schemas.coord
    Test.b.attachSchema schemas.coordPlus
    Test.b.schema().should.containDeep schemas.coord
    Test.b.schema().should.containDeep schemas.coordPlus


  it 'can validate a document', ->
    Test.b.attachSchema schemas.coord
    errors = Test.b.validate y: 'hello'
    errors.should.be.an.Array().and.have.property 'length', 2


  it 'can validate a document non greedily', ->
    Test.b.attachSchema schemas.coord
    errors = Test.b.validate {y: 'hello'}, {greedy: false}
    errors.should.not.be.an.Array()


  it 'can quickly check a document', ->
    Test.b.attachSchema schemas.coord
    Should.throws -> Test.b.check y: 'hello'


  it 'can clean a document', ->
    Test.b.attachSchema schemas.coord
    cleaned = Test.b.clean x: 1, y: 2, z: 5, a: 1
    cleaned.should.eql x: 1, y: 2
    cleaned.should.not.eql z: 5, a: 1


  it 'can get schema pieces', ->
    Test.b.attachSchema schemas.deep
    Test.b.schema( 'a' ).should.eql schemas.deep.properties.a
    Test.b.schema( 'a.b.c.d' ).should.eql schemas.deep.properties.a.properties.b.properties.c.properties.d


  it 'can get all object properties with the schema', ->
    Test.b.attachSchema schemas.coord
    Test.b.attachSchema schemas.coordPlus
    Test.b.attachSchema schemas.deep
    Test.b.properties().should.be.eql [
      'x', 'y', 'z',
      'a', 'a.b', 'a.b.c',
      'a.b.c.d'
    ]
    Test.b.properties( 'a.b' ).should.eql ['a.b.c', 'a.b.c.d']


  it 'can validate asynchronously', (done) ->
    Test.b.index 'a'
    Test.b.index 'c', unique: false
    Test.b.attachSchema
      required: ['b']
    Test.a.insert {a: 1, c: 3}, (e) ->
      done e if e?
      Test.b.validate {a: 1, c: 3}, (e, validationErrors) ->
        done e if e?
        validationErrors.should.be.an.Array().and.have.property 'length', 2
        validationErrors[0].should.containEql
          field: 'data.b'
          message: 'is required'
        validationErrors[1].should.containEql
          field: 'data.a'
          message: 'is not unique'
        done()
