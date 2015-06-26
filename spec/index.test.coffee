describe 'index methods', ->

  afterEach (done) -> Test.b.dropIndexes done


  it 'can add an index', (done) ->
    Test.b.index 'a'
    Test.b.index ['b', 'c']
    Test.b.index d: 1, e: -1
    Test.a.indexInformation (e, result) ->
      done e if e?
      result.a_1[0][0].should.be.exactly 'a'
      result.a_1[0][1].should.be.exactly 1
      result.b_1_c_1[0][0].should.be.exactly 'b'
      result.b_1_c_1[0][1].should.be.exactly 1
      result.b_1_c_1[1][0].should.be.exactly 'c'
      result.b_1_c_1[1][1].should.be.exactly 1
      result['d_1_e_-1'][0][0].should.be.exactly 'd'
      result['d_1_e_-1'][0][1].should.be.exactly 1
      result['d_1_e_-1'][1][0].should.be.exactly 'e'
      result['d_1_e_-1'][1][1].should.be.exactly -1
      done()
