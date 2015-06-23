const fs = require('fs')
const http = require('http')
const connect = require('connect')
const sinon = require('sinon')
const supertest = require('supertest')
const expect = require('chai').expect
const rocky = require('..')

const ports = { target: 9890, proxy: 9891, replay: 9892 }
const baseUrl = 'http://127.0.0.1'
const proxyUrl = baseUrl + ':' + ports.proxy
const targetUrl = baseUrl + ':' + ports.target
const replayUrl = baseUrl + ':' + ports.replay

suite('create', function () {
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
    setTimeout(done, 10)
  })

  test('basic config', function (done) {
    const config = {
      forward: targetUrl,
      port: ports.proxy,
    }

    config['/test'] = {
      method: 'GET',
      replay: [ replayUrl ]
    }

    proxy = rocky.create(config)
    server = createTestServer(assert)
    replay = createReplayServer(assert)

    http.get(proxyUrl + '/test', function (res) {
      expect(res.statusCode).to.be.equal(200)
      done()
    })

    function assert(req, res) {
      expect(req.url).to.be.equal('/test')
      expect(res.statusCode).to.be.match(/200|204/)
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
      if (assert) assert(req, res)
      res.end()
    })
  })

  server.listen(port)
  return server
}
