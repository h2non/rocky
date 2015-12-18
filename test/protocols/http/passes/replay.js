const http = require('http')
const sinon = require('sinon')
const expect = require('chai').expect
const Socket = require('net').Socket
const Route = require('../../lib/route')
const forward = require('../../lib/passes/replay')

const port = 9098

suite('replay', function () {
  test('concurrently', function (done) {
    var spy = sinon.spy()
    var server = createServer(port)
    var route = new Route('/')
    route.replays = [ 'http://localhost:' + port ]

    var opts = {}
    var req = new http.IncomingMessage(new Socket())
    req.rocky = {}
    req.push('foo')
    req.push(null)

    route.useReplay(function (req, res, next) { spy(); next() })

    forward(route, opts, req, null, assert)

    function assert (err, res) {
      expect(spy.calledOnce).to.be.true
      expect(err).to.be.undefined
      expect(res).to.be.undefined
      server.close(done)
    }
  })
})

function createServer (port) {
  var server = http.createServer(function (req, res) {
    res.end()
  })
  server.listen(port)
  return server
}
