const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#query', function () {
  test('parse', function (done) {
    var req = { url: 'host?foo=1&bar=2' }
    var mw = middleware.query()
    mw(req, null, next)

    function next () {
      expect(req.query).to.be.deep.equal({
        foo: '1', bar: '2'
      })
      expect(req.url).to.be.equal('host?foo=1&bar=2')
      done()
    }
  })

  test('extend', function (done) {
    var req = { url: 'host?foo=1&bar=2' }
    var params = { bar: 'foo', hello: 'world' }
    var mw = middleware.query(params)
    mw(req, null, next)

    function next () {
      expect(req.query).to.be.deep.equal({
        foo: '1', bar: 'foo', hello: 'world'
      })
      expect(req.url).to.be.equal('host?foo=1&bar=foo&hello=world')
      done()
    }
  })

  test('function', function (done) {
    var req = { url: 'host?foo=1&bar=2' }
    var params = { bar: 'foo', hello: 'world' }
    var mw = middleware.query(parser)
    mw(req, null, next)

    function parser (req, res, next) {
      req.query = params
      next()
    }

    function next () {
      expect(req.query).to.be.deep.equal({
        bar: 'foo', hello: 'world'
      })
      expect(req.url).to.be.equal('host?bar=foo&hello=world')
      done()
    }
  })

  test('already present', function (done) {
    var params = { bar: 'foo', hello: 'world' }
    var req = { url: 'host?foo=1&bar=2', query: params }
    var mw = middleware.query()
    mw(req, null, next)

    function next () {
      expect(req.query).to.be.deep.equal({
        bar: 'foo', hello: 'world'
      })
      expect(req.url).to.be.equal('host?bar=foo&hello=world')
      done()
    }
  })
})
