const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#toPath', function () {
  test('overwrite path', function () {
    const req = {}
    const newPath = '/new/path'
    const mw = middleware.toPath(newPath)

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal(newPath)
    })
  })

  test('dynamic params', function () {
    const req = {}
    const newPath = '/profile/:id'
    const mw = middleware.toPath(newPath, { id: 'chuck' })

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck')
    })
  })

  test('multiple params', function () {
    const req = {}
    const newPath = '/profile/:id/:action/photo/:code'
    const mw = middleware.toPath(newPath, { id: 'chuck', action: 'update', code: 100 })

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update/photo/100')
    })
  })

  test('default previous params', function () {
    const req = { params: { id: 'chuck', action: 'update' } }
    const req2 = { params: { id: 'chuck', action: 'delete' } }
    const newPath = '/profile/:id/:action'
    const mw = middleware.toPath(newPath)

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/update')
    })

    mw(req2, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req2.url).to.be.equal('/profile/chuck/delete')
    })
  })

  test('invalid params', function () {
    const req = {}
    const newPath = '/profile/:id/:action'
    const mw = middleware.toPath(newPath, { id: 'chuck', action: null })

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.url).to.be.equal('/profile/chuck/')
    })
  })

  test('wildcard mapping', function () {
    const tests = [
      {
        url: '/old-api/method-1',
        expect: '/new-api/method-1',
        route: { path: '/old-api/*' }
      },
      {
        url: '/old-api/method-2',
        expect: '/new-api/method-2',
        route: { path: '/old-api/*' }
      }
    ]

    const newPath = '/new-api/*'
    const mw = middleware.toPath(newPath)

    tests.forEach(function (req) {
      const originalUrl = req.url
      mw(req, null, function assert (err) {
        expect(err).to.be.undefined
        expect(req.url).to.be.equal(req.expect)
        expect(req.originalUrl).to.be.equal(originalUrl)
      })
    })
  })
})
