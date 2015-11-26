const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#redirect', function () {
  test('redirect', function (done) {
    var url = 'http://server'
    var headers = { Location: url }
    var mw = middleware.redirect(url)
    var res = { writeHead: writeHead, end: done }

    mw(null, res)

    function writeHead (code, writeHeaders) {
      expect(code).to.be.equal(301)
      expect(writeHeaders).to.be.deep.equal(headers)
    }
  })
})
