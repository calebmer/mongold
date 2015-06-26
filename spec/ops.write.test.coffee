describe 'write operations', ->


  it 'can insert a document', (done) ->
    Test.b.insert hello: 'world', (e, id) ->
      done e if e?
      Test.a.find( _id: id ).toArray (e, result) ->
        done e if e?
        result.should.be.an.Array()
        result[0].should.have.property 'hello', 'world'
        done()
