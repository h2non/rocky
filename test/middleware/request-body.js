const expect = require('chai').expect
const stream = require('stream')
const middleware = require('../../lib/middleware')

suite('middleware#requestBody', function () {
  var req, res

  beforeEach(function () {
    res = new stream.Writable
    req = new stream.Readable
    req.headers = {}
    req._read = function () {
      return Buffer.concat(this._readableState.buffer)
    }
  })

  function middlewareFn(req, res, next) {
    var body = req.body.toString('utf8')
    var newBody = body.split(' ').reverse().join(' ')
    next(null, newBody, 'utf8')
  }

  function pushData() {
    req.push(new Buffer('Ping '))
    req.push(new Buffer('Pong'))
    req.push(null)
  }

  test('transform', function (done) {
    req.on('end', function () {
      expect(req.body).to.be.equal('Pong Ping')
      done()
    })

    var mw = middleware.requestBody(middlewareFn)
    mw(req, res, function () {})

    pushData()
  })

  test('filter', function (done) {
    req.on('end', function () {
      expect(req.body).to.be.equal('Pong Ping')
      done()
    })

    function filter(req) {
      return !req.headers['content-type']
    }

    var mw = middleware.requestBody(middlewareFn, filter)
    mw(req, res, function () {})

    pushData()
  })
})
