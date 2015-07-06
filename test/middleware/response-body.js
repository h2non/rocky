const expect = require('chai').expect
const middleware = require('../../lib/middleware')
const noop = function () {}

suite('middleware#responseBody', function () {
  var req, res

  beforeEach(function () {
    res =  {
      write: noop,
      end: noop,
      getHeader: function () { return 'application/json' }
    }
  })

  function middlewareFn(req, res, next) {
    var body = res.body.toString()
    var newBody = body.split(' ').reverse().join(' ')
    next(null, newBody, 'utf8')
  }

  function writeData() {
    res.write(new Buffer('Ping '))
    res.write(new Buffer('Pong'))
    res.end()
  }

  test('transform', function (done) {
    res.end = function () {
      expect(res.body).to.be.equal('Pong Ping')
      done()
    }

    middleware.responseBody
      (middlewareFn)
        (null, res, noop)

    writeData()
  })

  test('filter', function (done) {
    res.end = function () {
      expect(res.body).to.be.equal('Pong Ping')
      done()
    }

    function filter(res) {
      return res.getHeader('content-type') === 'application/json'
    }

    middleware.responseBody
      (middlewareFn, filter)
        (null, res, noop)

    writeData()
  })
})
