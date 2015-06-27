const sinon = require('sinon')
const expect = require('chai').expect
const middlewares = require('../lib/middlewares')

suite('toPath()', function () {
  test('overwrite path', function (done) {
    var req = {}
    var newPath = '/new/path'
    var mw = middlewares.toPath(newPath)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal(newPath)
      done()
    })
  })

  test('dynamic params', function (done) {
    var req = {}
    var newPath = '/profile/:id'
    var mw = middlewares.toPath(newPath, { id: 'chuck' })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck')
      done()
    })
  })

  test('multiple params', function (done) {
    var req = {}
    var newPath = '/profile/:id/:action/photo/:code'
    var mw = middlewares.toPath(newPath, { id: 'chuck', action: 'update', code: 100 })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update/photo/100')
      done()
    })
  })

  test('default previous params', function (done) {
    var req = { params: { id: 'chuck', action: 'update' }}
    var newPath = '/profile/:id/:action'
    var mw = middlewares.toPath(newPath)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update')
      done()
    })
  })

  test('invalid params', function (done) {
    var req = {}
    var newPath = '/profile/:id/:action'
    var mw = middlewares.toPath(newPath, { id: 'chuck', action: null })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/')
      done()
    })
  })
})

suite('extendHeaders()', function () {
  test('add headers', function (done) {
    var req = { headers: { host: 'localhost' } }
    var headers = { custom: 'hello' }
    var mw = middlewares.headers(headers)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.headers).to.be.deep.equal({
        host: 'localhost',
        custom: 'hello'
      })
      done()
    })
  })

  test('overwrite headers', function (done) {
    var req = { headers: { host: 'localhost' } }
    var headers = { host: 'server.net' }
    var mw = middlewares.headers(headers)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.headers).to.be.deep.equal({ host: 'server.net' })
      done()
    })
  })
})

suite('transformResponseBody()', function () {
  test('transform body', function (done) {
    var body = []
    var res = { write: write, end: end }

    function write(data) {
      body.push(data)
    }

    function end() {
      expect(res.body).to.be.equal('Pong Ping')
      done()
    }

    var mw = middlewares.transformResponseBody(function (req, res, next) {
      var body = res.body.toString()
      var newBody = body.split(' ').reverse().join(' ')
      res.body = newBody
      res.write(newBody)
      next()
    })

    mw(null, res, function () {})

    res.write(new Buffer('Ping '))
    res.write(new Buffer('Pong'))
    res.end()
  })
})

suite('changeHost()', function () {
  test('overwrite', function (done) {
    var req = { headers: { host: 'localhost' } }
    var mw = middlewares.host('server.net')

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.headers.host).to.be.equal('server.net')
      done()
    })
  })
})
