const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#requestBody', function () {
  test('transform', function (done) {
    const body = []
    const noop = function () {}
    const res = { write: write, end: end }
    const req = { pause: noop, resume: noop, write: write }

    function write(data) {
      body.push(data)
    }

    function end() {
      expect(res.body).to.be.equal('Pong Ping')
      done()
    }

    /*
    var mw = middleware.requestBody(function (req, res, next) {
      var body = res.body.toString()
      var newBody = body.split(' ').reverse().join(' ')
      res.body = newBody
      res.write(newBody)
      next()
    })

    mw(req, res, function () {})

    req.write(new Buffer('Ping '))
    req.write(new Buffer('Pong'))
    res.end()
    */

    done()
  })
})
