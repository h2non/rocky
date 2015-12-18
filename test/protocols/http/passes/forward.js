const http = require('http')
const sinon = require('sinon')
const expect = require('chai').expect
const Socket = require('net').Socket
const Route = require('../../../../../lib/route')
const forward = require('../../../../lib/passes/forward')
const ResponseStub = require('../../../../lib/protocols/http/response')

const port = 8099

suite('forward', function () {
  test('valid', function (done) {
    var spy = sinon.spy()
    var server = createServer(port)
    var route = new Route('/')
    var res = new ResponseStub()
    var opts = { target: 'http://localhost:' + port }

    var req = new http.IncomingMessage(new Socket())
    req.rocky = { options: {} }
    req.push('foo')
    req.push(null)

    route.useForward(function (req, res, next) { spy(); next() })
    route.on('proxyRes', spy)
    route.on('proxyReq', spy)

    forward(route, opts, req, res, assert)

    function assert (err, res) {
      expect(spy.calledThrice).to.be.true
      expect(err).to.be.null
      expect(res).to.be.an('object')
      server.close(done)
    }
  })

  test('forward host', function (done) {
    var spy = sinon.spy()
    var host = 'localhost:' + port
    var server = createServer(port, assertServer)
    var route = new Route('/')
    var res = new ResponseStub()
    var opts = { forwardHost: true, target: 'http://127.0.0.1:' + port }

    var req = new http.IncomingMessage(new Socket())
    req.rocky = { options: {} }
    req.push('foo')
    req.push(null)

    route.useForward(assertMiddleware)
    route.on('proxyRes', spy)
    route.on('proxyReq', spy)

    forward(route, opts, req, res, assert)

    function assertMiddleware (req, res, next) {
      req.headers.host = host
      spy(); next()
    }

    function assertServer (req, res) {
      spy()
      expect(req.headers.host).to.be.equal(host)
    }

    function assert (err, res) {
      expect(spy.args).to.have.length(4)
      expect(err).to.be.null
      expect(res).to.be.an('object')
      server.close(done)
    }
  })
})

function createServer (port, assert) {
  var server = http.createServer(function (req, res) {
    res.setHeader('test', 'forward')
    if (assert) assert(req, res)
    res.end()
  })
  server.listen(port)
  return server
}
