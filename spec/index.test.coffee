describe 'index methods', ->

  before (done) -> Test.b.remove done
  afterEach (done) -> Test.b.dropIndexes done


  it 'can add an index', (done) ->
    Test.b.index '/a', (e) ->
      return done e if e?
      Test.b.index '/c', unique: false, (e) ->
        return done e if e?
        Test.b.index {'/d': 1, '/e': -1}, (e) ->
          return done e if e?
          Test.a.indexInformation (e, result) ->
            return done e if e?
            result.a_1[0][0].should.be.exactly 'a'
            result.a_1[0][1].should.be.exactly 1
            result.c_1[0][0].should.be.exactly 'c'
            result.c_1[0][1].should.be.exactly 1
            result['d_1_e_-1'][0][0].should.be.exactly 'd'
            result['d_1_e_-1'][0][1].should.be.exactly 1
            result['d_1_e_-1'][1][0].should.be.exactly 'e'
            result['d_1_e_-1'][1][1].should.be.exactly -1
            done()
