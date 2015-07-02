const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#toPath', function () {
  test('overwrite path', function (done) {
    var req = {}
    var newPath = '/new/path'
    var mw = middleware.toPath(newPath)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal(newPath)
      done()
    })
  })

  test('dynamic params', function (done) {
    var req = {}
    var newPath = '/profile/:id'
    var mw = middleware.toPath(newPath, { id: 'chuck' })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck')
      done()
    })
  })

  test('multiple params', function (done) {
    var req = {}
    var newPath = '/profile/:id/:action/photo/:code'
    var mw = middleware.toPath(newPath, { id: 'chuck', action: 'update', code: 100 })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update/photo/100')
      done()
    })
  })

  test('default previous params', function (done) {
    var req = { params: { id: 'chuck', action: 'update' }}
    var newPath = '/profile/:id/:action'
    var mw = middleware.toPath(newPath)

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update')
      done()
    })
  })

  test('invalid params', function (done) {
    var req = {}
    var newPath = '/profile/:id/:action'
    var mw = middleware.toPath(newPath, { id: 'chuck', action: null })

    mw(req, null, function assert(err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/')
      done()
    })
  })
})
