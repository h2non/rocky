const http = require('http')
const sinon = require('sinon')
const expect = require('chai').expect
const Socket = require('net').Socket
const Route = require('../../lib/route')
const ResponseStub = require('../../lib/http/response')
const forward = require('../../lib/passes/forward')

const port = 8099

suite('forward', function () {
  test('valid', function (done) {
    var spy = sinon.spy()
    var server = createServer(port)
    var route = new Route('/')
    var res = new ResponseStub()
    var opts = { target: 'http://localhost:' + port }

    var req = new http.IncomingMessage(new Socket)
    req.rocky = { options: {} }
    req.push('foo')
    req.push(null)

    route.useForward(function (req, res, next) { spy(); next() })
    route.on('proxyRes', spy)
    route.on('proxyReq', spy)

    forward(route, opts, req, res, assert)

    function assert(err, res) {
      expect(spy.calledThrice).to.be.true
      expect(err).to.be.null
      expect(res).to.be.an('object')
      server.close(done)
    }
  })
})

function createServer(port) {
  var server = http.createServer(function (req, res) {
    res.setHeader('test', 'forward')
    res.end()
  })
  server.listen(port)
  return server
}
