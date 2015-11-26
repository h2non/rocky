const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#reply', function () {
  test('reply', function (done) {
    var res = { writeHead: writeHead, end: end }

    var body = 'Hello World'
    var headers = { 'Content-Type': 'application/json' }
    var mw = middleware.reply(201, headers, body)

    function writeHead (code, writeHeaders) {
      expect(code).to.be.equal(201)
      expect(writeHeaders).to.be.deep.equal(headers)
    }

    function end (buf) {
      expect(buf).to.be.equal(body)
      done()
    }

    mw(null, res)
  })
})
