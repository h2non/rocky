const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#headers', function () {
  test('add', function (done) {
    var req = { headers: { host: 'localhost' } }
    var headers = { custom: 'hello' }
    var mw = middleware.headers(headers)

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.headers).to.be.deep.equal({
        host: 'localhost',
        custom: 'hello'
      })
      done()
    })
  })

  test('overwrite', function (done) {
    var req = { headers: { host: 'localhost' } }
    var headers = { host: 'server.net' }
    var mw = middleware.headers(headers)

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.headers).to.be.deep.equal({ host: 'server.net' })
      done()
    })
  })
})
