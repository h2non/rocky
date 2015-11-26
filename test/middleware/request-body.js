const stream = require('stream')
const Socket = require('net').Socket
const Request = require('http').IncomingMessage
const middleware = require('../../lib/middleware')

suite('middleware#requestBody', function () {
  var req, res

  beforeEach(function () {
    res = new stream.Writable()
    req = new Request(new Socket())
    req.headers = {}
    req._read = function () {
      return Buffer.concat(this._readableState.buffer)
    }
  })

  function middlewareFn (req, res, next) {
    var body = req.body.toString('utf8')
    var newBody = body.split(' ').reverse().join(' ')
    next(null, newBody, 'utf8')
  }

  test('body already present', function (done) {
    req.body = new Buffer('Ping Pong')

    middleware.requestBody(middlewareFn)(req, res, done)
  })

  test('filter function', function (done) {
    function filter (req) {
      return req.headers['content-type']
    }

    middleware.requestBody(middlewareFn, filter)(req, res, done)
  })

  test('filter regexp', function (done) {
    req.headers['content-type'] = 'text/html; charset=utf8'
    middleware.requestBody(middlewareFn, /application\/json/i)(req, res, done)
  })

  test('invalid method', function (done) {
    req.method = 'GET'
    middleware.requestBody(middlewareFn)(req, res, done)
  })
})
