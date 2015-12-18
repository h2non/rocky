const expect = require('chai').expect
const StubResponse = require('../../../lib/protocols/http/response')

suite('stub response', function () {
  test('emitter api', function () {
    const res = new StubResponse()
    expect(res.on).to.be.a('function')
    expect(res.emit).to.be.a('function')
    expect(res.removeListener).to.be.a('function')
  })

  test('headers', function () {
    const res = new StubResponse()
    res.setHeader('foo', 'bar')
    expect(res.getHeader('foo')).to.be.equal('bar')
    res.removeHeader('foo')
    expect(res.getHeader('foo')).to.be.undefined
  })

  test('write', function () {
    const res = new StubResponse()
    res.write('foo')
    res.write('bar')
    expect(res._body).to.be.equal('foobar')
    expect(res.headerSent).to.be.false
  })

  test('writeHead', function () {
    const res = new StubResponse()
    res.writeHead(200)
    expect(res._status).to.be.equal(200)
    expect(res.headerSent).to.be.true
  })

  test('cannot write head again', function () {
    const res = new StubResponse()
    res.writeHead(200)
    expect(res._status).to.be.equal(200)
    expect(res.headerSent).to.be.true
    expect(function () {
      res.writeHead(200)
    }).to.throw(Error)
  })

  test('end', function (done) {
    const res = new StubResponse()
    res.once('end', function () {
      expect(res._body).to.be.equal('foo')
      expect(res.headerSent).to.be.true
      expect(res._bodySent).to.be.true
      done()
    })
    res.writeHead(200)
    res.end('foo')
  })

  test('cannot write body again', function () {
    const res = new StubResponse()
    res.writeHead(200)
    expect(res._status).to.be.equal(200)
    expect(res.headerSent).to.be.true
    res.end('foo')
    expect(function () {
      res.write('flo')
    }).to.throw(Error)
  })
})
