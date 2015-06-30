describe 'join methods', ->

  A = new Model 'a'
  B = new Model 'b'
  C = new Model 'c'
  A.join
    '/propB': B
    '/propC': C
  C.join '/propC', C

  a1 = new A hello: 'world'
  a2 = undefined
  b1 = new B world: 'hello'
  b2 = new B world: 'goodbye'
  c1 = new C hello: 'moon'
  c2 = undefined

  before (done) ->
    Async.series [
      (next) ->
        Async.parallel [
          (d) -> a1.save d
          (d) -> b1.save d
          (d) -> b2.save d
          (d) -> c1.save d
        ], next
      (next) ->
        Async.series [
          (d) ->
            c2 = new C
              hello: 'moon2'
              propC: c1._id
            c2.save d
          (d) ->
            a2 = new A
              hello: 'world2'
              propB: b1._id
              propC: c2._id
            a2.save d
        ], next
    ], done

  after (done) -> A.remove done
  after (done) -> B.remove done
  after (done) -> C.remove done


  it 'can fetch a graph', (done) ->
    A.fetch (e, documents) ->
      done e if e?
      console.log documents
      documents.should.containDeep [hello: 'world']
      documents.should.containDeep [hello: 'world2']
      documents.should.containDeep [world: 'hello']
      documents.should.containDeep [hello: 'moon2']
      documents.should.containDeep [hello: 'moon']
      done()
