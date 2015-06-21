const http = require('http')
const expect = require('chai').expect
const rocky = require('../')

const ports = { target: 9890, proxy: 9891 }
const baseUrl = 'http://127.0.0.1'
const targetUrl = baseUrl + ':' + ports.target
const noop = function () {}

suite('rocky', function () {
  var proxy = null

  afterEach(function () {
    proxy.server.close()
  })

  test('simple forward', function (done) {
    proxy = rocky()
      .forward('http://127.0.0.1:' + ports.target)
      .listen(ports.proxy)

    proxy.get('/test')

    createTestServer(assert)

    http.get(targetUrl + '/test', noop)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      done()
    }
  })

})

function createTestServer(assert) {
  var server = http.createServer(function (req, res) {
    res.writeHead(200)
    res.end()
    assert(req, res)
  })
  server.listen(ports.target)
}
