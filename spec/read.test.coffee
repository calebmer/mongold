describe 'read operations', ->

  before (done) -> Test.a.insert [
    {x: 1, y: 5},
    {x: 2, y: 4},
    {x: 3, y: 3},
    {x: 4, y: 2},
    {x: 5, y: 1}
  ], done

  after (done) -> Test.a.remove done


  it 'can find all documents', (done) ->
    Test.b.find (e, documents) ->
      done e if e?
      documents.should.be.an.Array().and.have.property 'length', 5
      done()


  it 'can find one document', (done) ->
    Test.b.findOne x: 2, (e, document) ->
      done e if e?
      document.should.not.be.an.Array()
      document.should.have.property 'x', 2
      document.should.have.property 'y', 4
      done()


  it 'returns a constructed object', (done) ->
    Test.b.find (e, documents) ->
      done e if e?
      documents.forEach (document) -> document.should.be.an.instanceOf Test.b
      done()


  it 'can exclude properties with the shorthand', (done) ->
    Test.b.find {},
      exclude: ['x']
    , (e, documents) ->
      done e if e?
      documents.forEach (document) ->
        document.should.have.property 'y'
        document.should.not.have.property 'x'
      done()


  it 'can include properties with the shorthand', (done) ->
    Test.b.find {},
      include: ['x']
    , (e, documents) ->
      done e if e?
      documents.forEach (document) ->
        document.should.have.property 'x'
        document.should.not.have.property 'y'
      done()


  it 'can sort documents with the shorthand', (done) ->
    Test.b.find {},
      sort:
        x: 'desc'
    , (e, documents) ->
      done e if e?
      lastValue = 6
      documents.forEach (document) ->
        document.x.should.be.below lastValue
        lastValue = document.x
      done()
