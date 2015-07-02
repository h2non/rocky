const expect = require('chai').expect
const middleware = require('../../lib/middleware')

suite('middleware#responseBody', function () {
  test('transform', function (done) {
    var body = []
    var res = { write: write, end: end }

    function write(data) {
      body.push(data)
    }

    function end() {
      expect(res.body).to.be.equal('Pong Ping')
      done()
    }

    var mw = middleware.responseBody(function (req, res, next) {
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
