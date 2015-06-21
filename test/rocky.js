const http = require('http')
const supertest = require('supertest')
const expect = require('chai').expect
const rocky = require('../')

const ports = { target: 9890, proxy: 9891, replay: 9892 }
const baseUrl = 'http://127.0.0.1'
const proxyUrl = baseUrl + ':' + ports.proxy
const targetUrl = baseUrl + ':' + ports.target
const replayUrl = baseUrl + ':' + ports.replay
const noop = function () {}

suite('rocky', function () {
  var proxy, replay, server

  beforeEach(function () {
    proxy = replay = server = null
  })

  afterEach(function (done) {
    if (replay) replay.close()
    if (server) server.close()
    if (proxy) proxy.server.close()
    setTimeout(done, 10)
  })

  test('simple forward', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .listen(ports.proxy)

    server = createTestServer(assert)

    proxy.get('/test')
    http.get(proxyUrl + '/test', noop)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      done()
    }
  })

  test('forward and replay', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.get('/test')

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
    }
  })

  test('forward and replay to multiple backends', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .replay(replayUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.get('/test')

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(noop)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
    }

    var asserts = 0
    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)

      asserts += 1
      if (asserts === 3) {
        done()
      }
    }
  })

  test('forward and replay payload data', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.post('/test')

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    supertest(proxyUrl)
      .post('/test')
      .send({ hello: 'world' })
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(req.body).to.match(/hello/)
    }

    var asserts = 0
    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(req.body).to.match(/hello/)
    }
  })

})

function createTestServer(assert) {
  return createServer(ports.target, 200, assert)
}

function createReplayServer(assert) {
  return createServer(ports.replay, 204, assert)
}

function createServer(port, code, assert) {
  var server = http.createServer(function (req, res) {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ 'hello': 'world' }))

    var body = ''
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      req.body = body
      assert(req, res)
      res.end()
    })
  })

  server.listen(port)
  return server
}
