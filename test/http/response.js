const expect = require('chai').expect
const StubResponse = require('../../lib/http/response')

suite('stub response', function () {
  var res = new StubResponse

  test('emitter api', function () {
    expect(res.on).to.be.a('function')
    expect(res.emit).to.be.a('function')
    expect(res.removeListener).to.be.a('function')
  })

  test('headers', function () {
    res.setHeader('foo', 'bar')
    expect(res.getHeader('foo')).to.be.equal('bar')
    res.removeHeader('foo')
    expect(res.getHeader('foo')).to.be.undefined
  })

  test('write', function () {
    res.write('foo')
    res.write('bar')
    expect(res._body).to.be.equal('foobar')
    expect(res.headerSent).to.be.false
  })

  test('writeHead', function () {
    res.writeHead(200)
    expect(res._status).to.be.equal(200)
    expect(res.headerSent).to.be.true
  })

  test('cannot write head again', function () {
    expect(function () {
      res.writeHead(200)
    }).to.throw(Error)
  })

  test('end', function () {
    var ended = false
    res.once('end', function () { ended = true })
    res.end('foo')
    expect(ended).to.be.true
    expect(res._body).to.be.equal('foobarfoo')
    expect(res.headerSent).to.be.true
    expect(res._bodySent).to.be.true
  })

  test('cannot write body again', function () {
    expect(function () {
      res.write('flo')
    }).to.throw(Error)
  })
})
