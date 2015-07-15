const fs = require('fs')
const http = require('http')
const connect = require('connect')
const sinon = require('sinon')
const supertest = require('supertest')
const request = require('request')
const expect = require('chai').expect
const rocky = require('..')

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
    if (proxy && proxy.server) {
      proxy.server.close()
    }
    setTimeout(done, 50)
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
      asserts++
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      if (asserts > 2) done()
    }
  })

  test('forward and replay with payload', function (done) {
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
      .end()

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(req.body).to.be.equal('{"hello":"world"}')
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(req.body).to.be.equal('{"hello":"world"}')
      done()
    }
  })

  test('forward and replay large payload', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.post('/test')

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    var body = longString()
    supertest(proxyUrl)
      .post('/test')
      .type('text/plain')
      .send(body)
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(req.body).to.be.equal(body)
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(req.body).to.be.equal(body)
    }
  })

  test('forward and replay large payload as stream', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.post('/test')

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    var body = fs.readFileSync('test/fixtures/data.json').toString()

    fs.createReadStream('test/fixtures/data.json')
      .pipe(request.post(proxyUrl + '/test'))

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(req.body).to.be.equal(body)
    }

    var replays = 0
    function assertReplay(req, res) {
      replays += 1
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(req.body).to.be.equal(body)
      if (replays > 1) done()
    }
  })

  test('global middleware', function (done) {
    proxy = rocky().forward(targetUrl)
    server = createTestServer(assert)

    var spy = sinon.spy()
    proxy.use(function (req, res, next) {
      spy(req, res)
      next()
    })

    var routespy = sinon.spy()
    proxy.get('/test')
      .use(function (req, res, next) {
        routespy(req, res)
        next()
      })

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(spy.calledOnce).to.be.true
      expect(routespy.calledOnce).to.be.true
      expect(spy.args[0][0].rocky).to.be.an('object')
      expect(spy.args[0][0].rocky.options).to.be.an('object')
      expect(spy.args[0][0].rocky.proxy).to.be.an('object')
      expect(spy.args[0][0].rocky.route).to.be.an('object')
    }
  })

  test('forward middleware', function (done) {
    var spy = sinon.spy()
    proxy = rocky().forward(targetUrl)
    server = createTestServer(assert)

    proxy.useForward(middlewareFn)
    proxy.get('/test')
      .useForward(middlewareFn)

    function middlewareFn(req, res, next) {
      spy(req, res)
      next()
    }

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(spy.calledTwice).to.be.true
      expect(spy.args[0][0].rocky).to.be.an('object')
      expect(spy.args[0][0].rocky.options).to.be.an('object')
      expect(spy.args[0][0].rocky.proxy).to.be.an('object')
      expect(spy.args[0][0].rocky.route).to.be.an('object')
    }
  })

  test('replay middleware', function (done) {
    proxy = rocky().forward(targetUrl)
    server = createTestServer()
    replay = createReplayServer(assert)

    var spy = sinon.spy()
    proxy.replay(replayUrl)
    proxy.useReplay(middlewareFn)

    proxy.get('/test')
      .useReplay(middlewareFn)

    function middlewareFn(req, res, next) {
      spy(req, res)
      next()
    }

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(spy.calledTwice).to.be.true
      expect(spy.args[0][0].rocky).to.be.an('object')
      expect(spy.args[0][0].rocky.options).to.be.an('object')
      expect(spy.args[0][0].rocky.proxy).to.be.an('object')
      expect(spy.args[0][0].rocky.route).to.be.an('object')
    }
  })

  test('param middleware', function (done) {
    var spy = sinon.spy()
    proxy = rocky().forward(targetUrl)
    server = createTestServer(assert)

    proxy.useParam('id', middlewareFn)
    proxy.get('/:id')

    function middlewareFn(req, res, next) {
      spy(req, res)
      next()
    }

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/1')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/1')
      expect(res.statusCode).to.be.equal(200)
      expect(spy.calledOnce).to.be.true
    }
  })

  test('overwrite forward options via middleware', function (done) {
    var spy = sinon.spy()
    proxy = rocky().forward('http://invalid')
    server = createTestServer(assert)

    proxy.get('/test')
      .use(middlewareFn)

    function middlewareFn(req, res, next) {
      spy(req, res)
      req.rocky.options.target = targetUrl
      next()
    }

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(spy.calledOnce).to.be.true
    }
  })

  test('overwrite replay options via middleware', function (done) {
    var spy = sinon.spy()
    proxy = rocky()
      .forward(targetUrl)
      .replay('http://invalid')
      .on('replay:start', spy)
      .on('replay:error', spy)

    server = createTestServer()
    replay = createReplayServer(assert)

    proxy.get('/test')
      .useReplay(middlewareFn)

    function middlewareFn(req, res, next) {
      spy(req, res)
      req.rocky.options.target = replayUrl
      next()
    }

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(done)

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(spy.calledTwice).to.be.true
      expect(spy.args[0][0].url).to.be.equal('/test')
      expect(spy.args[0][0].rocky.options.target).to.be.deep.equal(replayUrl)
    }
  })

  test('forward events', function (done) {
    var spy = sinon.spy()
    server = createTestServer(assert)
    replay = createReplayServer(assertReplay)

    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .on('proxyRes', spy)
      .on('proxyReq', spy)
      .on('replay:start', spy)
      .on('replay:error', spy)
      .on('route:error', spy)
      .on('error', spy)

    proxy.get('/test')
      .on('proxyRes', spy)
      .on('proxyReq', spy)
      .on('replay:start', spy)
      .on('replay:error', spy)

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(end)

    function end(err) {
      expect(err).to.be.null
      expect(spy.args.length).to.be.equal(6)
      done()
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
    }

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
    }
  })

  test('body buffer', function (done) {
    proxy = rocky()
      .forward(targetUrl, { forwardOriginalBody: true })
      .replay(replayUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy
      .post('/payload')
      .bufferBody()
      .transformRequestBody(function (req, res, next) {
        var body = JSON.parse(req.body.toString())
        var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })
        next(null, newBody)
      })

    server = createTestServer(assert)
    replay = createReplayServer(assertReplay)

    supertest(proxyUrl)
      .post('/payload')
      .type('application/json')
      .send('{"hello": "world"}')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ salutation: 'hello world' })
      .end(function () {})

    function assert(req, res) {
      expect(req.url).to.be.equal('/payload')
      expect(req.body).to.be.equal('{"hello": "world"}')
      expect(res.statusCode).to.be.equal(200)
    }

    var calls = 0
    function assertReplay(req, res) {
      calls++
      expect(req.url).to.be.equal('/payload')
      expect(req.body).to.be.equal('{"salutation":"hello world"}')
      expect(res.statusCode).to.be.equal(204)
      if (calls > 1) done()
    }
  })

  test('intercept and transform response payload', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy
      .post('/payload')
      .transformResponseBody(function (req, res, next) {
        var body = JSON.parse(res.body.toString())
        var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })
        next(null, newBody)
      })

    replay = createReplayServer(assert)
    server = createTestServer(assert)

    supertest(proxyUrl)
      .post('/payload')
      .type('application/json')
      .send('{"hello": "world"}')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ salutation: 'hello world' })
      .end(function () {})

    var calls = 0
    function assert(req, res) {
      calls++
      expect(req.url).to.be.equal('/payload')
      expect(res.statusCode).to.match(/200|204/)
      if (calls > 2) done()
    }
  })

  test('intercept and transform request payload', function (done) {
    proxy = rocky()
      .forward(targetUrl)
      .replay({ target: replayUrl, replayOriginalBody: true })
      .replay({ target: replayUrl, replayOriginalBody: true })
      .listen(ports.proxy)

    proxy
      .post('/payload')
      .transformRequestBody(function (req, res, next) {
        var body = JSON.parse(req.body.toString())
        var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })
        next(null, newBody)
      })

    replay = createReplayServer(assertReplay)
    server = createTestServer(assert)

    supertest(proxyUrl)
      .post('/payload')
      .type('application/json')
      .send('{"hello":"world"}')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({'hello': 'world'})
      .end(end)

    function end(err) {
      setTimeout(function () { done(err) }, 50)
    }

    function assert(req, res) {
      expect(req.url).to.be.equal('/payload')
      expect(res.statusCode).to.be.equal(200)
      expect(req.body).to.be.equal('{"salutation":"hello world"}')
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/payload')
      expect(res.statusCode).to.be.equal(204)
      expect(req.body).to.be.equal('{"hello":"world"}')
    }
  })

  test('route', function (done) {
    var spy = sinon.spy()
    proxy = rocky()
    server = createTestServer(assert)
    replay = createReplayServer(assertReplay)

    proxy.get('/test')
      .forward(targetUrl)
      .replay(replayUrl)
      .options({ hostRewrite: true })
      .on('proxyReq', spy)
      .on('replay:start', spy)
      .on('error', spy)
      .use(function (req, res, next) {
        req.headers['X-Test'] = 'rocky'
        next()
      })

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(end)

    function end() {
      expect(spy.calledTwice).to.be.true
      done()
    }

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(200)
      expect(req.headers['x-test']).to.be.equal('rocky')
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      expect(req.headers['x-test']).to.be.equal('rocky')
    }
  })

  test('missing target', function (done) {
    var spy = sinon.spy()
    proxy = rocky()

    proxy.get('/test')
      .on('error', spy)
      .on('proxyReq', spy)
      .on('route:error', spy)

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(502)
      .expect('Content-Type', 'application/json')
      .end(assert)

    function assert(err, res) {
      var errorMsg = /missing target URL/i
      expect(spy.calledOnce).to.be.true
      expect(res.statusCode).to.be.equal(502)
      expect(spy.args[0][0].message).to.match(errorMsg)
      expect(spy.args[0][1].url).to.be.equal('/test')
      expect(res.body.message).to.match(errorMsg)
      done()
    }
  })

  test('missing route', function (done) {
    var spy = sinon.spy()
    proxy = rocky()

    proxy
      .on('route:missing', spy)

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(end)

    function end(err, res) {
      expect(spy.calledOnce).to.be.true
      expect(res.statusCode).to.be.equal(502)
      expect(res.body.message).to.be.equal('No route configured')
      done()
    }
  })

  test('replay after forward', function (done) {
    var spy = sinon.spy()
    proxy = rocky()
    server = createTestServer(spy, 100)
    replay = createReplayServer(assertReplay)

    proxy.options({ replayAfterForward: true })
    proxy.get('/test')
      .forward(targetUrl)
      .replay(replayUrl)
    proxy.listen(ports.proxy)

    var start = Date.now()
    supertest(proxyUrl)
      .get('/test')
      .expect(200)
      .expect('Content-Type', 'application/json')
      .expect({ 'hello': 'world' })
      .end(function (err) {
        if (err) done(err)
      })

    function assertReplay() {
      expect(spy.calledOnce).to.be.true
      expect((Date.now() - start) >= 100).to.be.true
      done()
    }
  })

  test('do not replay if forward fails', function (done) {
    var spy = sinon.spy()
    proxy = rocky()
    replay = createReplayServer(spy)

    proxy.options({ replayAfterForward: true })
    proxy.get('/test')
      .forward('http://invalid')
      .replay(replayUrl)
    proxy.listen(ports.proxy)

    var start = Date.now()
    supertest(proxyUrl)
      .get('/test')
      .expect(502)
      .expect('Content-Type', 'application/json')
      .end(function (err) {
        setTimeout(function () {
          expect(spy.calledOnce).to.be.false
          done(err)
        }, 50)
      })
  })

  test('unavailable forward server', function (done) {
    var spy = sinon.spy()
    proxy = rocky()

    proxy.get('/test')
      .forward('http://invalid.server')
      .on('proxyReq', spy)
      .on('proxy:error', spy)

    proxy.listen(ports.proxy)

    supertest(proxyUrl)
      .get('/test')
      .expect(502)
      .expect('Content-Type', 'application/json')
      .expect(/ENOTFOUND/)
      .end(end)

    function end(err, res) {
      expect(spy.calledTwice).to.be.true
      expect(spy.args[1][0].message).to.match(/ENOTFOUND/)
      done()
    }
  })

  test('replay without forwarding', function (done) {
    var spy = sinon.spy()

    replay = createReplayServer(assertReplay)
    proxy = rocky()
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.get('/test')
      .on('proxyReq', spy)
      .on('route:error', spy)

    supertest(proxyUrl)
      .get('/test')
      .expect(404)
      .expect('Content-Type', 'application/json')
      .expect(/Cannot forward/i)
      .end(end)

    function end(err, res) {
      expect(spy.calledOnce).to.be.true
      expect(spy.args[0][0].message).to.match(/Target URL/i)
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      done()
    }
  })

  test('timeout', function (done) {
    var spy = sinon.spy()
    var serverSpy = sinon.spy()

    replay = createReplayServer(assertReplay)
    server = createTimeoutServer()

    proxy = rocky()
      .forward(targetUrl)
      .replay(replayUrl)
      .listen(ports.proxy)

    proxy.get('/test')
      .options({ timeout: 50 })
      .on('proxyReq', spy)
      .on('proxy:error', spy)

    supertest(proxyUrl)
      .get('/test')
      .end(end)

    function end(err, res) {
      expect(spy.calledOnce).to.be.true
      expect(serverSpy.calledOnce).to.be.true
      expect(err.code).to.be.equal('ECONNRESET')
      done()
    }

    function assertReplay(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.equal(204)
      serverSpy()
    }
  })

  test('balancer', function (done) {
    var spy = sinon.spy()
    proxy = rocky()

    var server1 = createServer(9893, 200, spy)
    var server2 = createServer(9894, 201, spy)
    var server3 = createServer(9895, 202, spy)

    proxy
      .get('/test')
      .balance([
        'http://localhost:9893',
        'http://localhost:9894',
        'http://localhost:9895'
      ])

    proxy.listen(ports.proxy)

    var count = 0
    request()

    function request() {
      count += 1
      supertest(proxyUrl)
        .get('/test')
        .expect(200 + count)
        .expect('Content-Type', 'application/json')
        .expect({ 'hello': 'world' })
        .end(count === 3 ? assert : request)
    }

    function assert() {
      expect(spy.calledThrice).to.be.true
      done()
    }
  })

  test('connect middleware', function (done) {
    proxy = rocky().forward(targetUrl)
    server = createTestServer(assert)
    proxy.get('/test')

    var app = connect()
      .use(proxy.middleware())
      .listen(ports.proxy)

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
  })

})

function createTestServer(assert, timeout) {
  return createServer(ports.target, 200, assert, timeout)
}

function createReplayServer(assert, timeout) {
  return createServer(ports.replay, 204, assert, timeout)
}

function createTimeoutServer(assert) {
  return createServer(ports.target, 503, assert, 30 * 1000)
}

function createServer(port, code, assert, timeout) {
  var server = http.createServer(function (req, res) {
    setTimeout(handler, +timeout || 1)

    function handler() {
      res.writeHead(code, { 'Content-Type': 'application/json' })
      res.write(JSON.stringify({ 'hello': 'world' }))

      var body = ''
      req.on('data', function (data) {
        body += data
      })
      req.on('end', function () {
        req.body = body
        end()
      })
    }

    function end() {
      if (assert) assert(req, res)
      res.end()
    }
  })

  server.listen(port)
  return server
}

function longString(x) {
  var s = ''
  x = +x || 1024 * 1024 * 5
  while (s.length < x && x > 0) {
    var r = Math.random()
    s+= r < 0.1 ? Math.floor(r*100): String.fromCharCode(Math.floor(r*26) + (r>0.5?97:65))
  }
  return s
}
