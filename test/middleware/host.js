const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#host', function () {
  test('overwrite', function (done) {
    var req = { headers: { host: 'localhost' } }
    var mw = middleware.host('server.net')

    mw(req, null, function assert (err) {
      expect(err).to.be.undefined
      expect(req.headers.host).to.be.equal('server.net')
      done()
    })
  })
})
