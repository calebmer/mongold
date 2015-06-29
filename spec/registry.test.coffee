describe 'the registry', ->

  A = new Model 'a'
  B = new Model 'b'
  C = new Model 'c'

  after ->
    Registry.remove 'a'
    Registry.remove 'b'
    Registry.remove 'c'


  it 'will register and unregister a model by its name', ->
    Registry.add C
    Registry.remove 'b'
    Registry.exists('a').should.be.ok()
    Registry.exists('b').should.not.be.ok()
    Registry.exists('c').should.be.ok()
    Registry.add B
    Registry.exists('b').should.be.ok()


  it 'can get a model by its name', ->
    Registry.get('c').should.be.exactly C
