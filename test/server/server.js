const fs = require('fs')
const WebSocket = require('ws')
const expect = require('chai').expect
const supertest = require('supertest')
const server = require('../../lib/server')

const port = 8099
const fixtures = __dirname + '/../fixtures'

suite('server', function () {
  var rockyStub = { router: reply }

  function reply (req, res) {
    res.statusCode = 201
    res.setHeader('foo', 'bar')
    res.end('foo')
  }

  test('listen', function (done) {
    rockyStub.opts = { port: port }
    var s = server(rockyStub)

    supertest('http://localhost:' + port)
      .get('/')
      .expect(201)
      .expect('foo', 'bar')
      .expect('Server', 'rocky')
      .expect('foo')
      .end(function (err) {
        s.close()
        done(err)
      })
  })

  test('ssl', function (done) {
    var ssl = {
      cert: fs.readFileSync(fixtures + '/cert.pem', 'utf8'),
      key: fs.readFileSync(fixtures + '/key.pem', 'utf8')
    }

    rockyStub.opts = { port: port, ssl: ssl }
    var s = server(rockyStub)

    require('https').request({
      host: '127.0.0.1',
      port: port,
      rejectUnauthorized: false
    }, function (res) {
      expect(res.statusCode).to.be.equal(201)
      expect(res.headers.server).to.be.equal('rocky')
      expect(res.headers.foo).to.be.equal('bar')
      s.close()
      done()
    }).end()
  })

  test('web socket', function (done) {
    rockyStub.mw = { run: function (a, b, c, d, next) { next() } }
    rockyStub.mw = { run: function (a, b, c, d, next) { next() } }
    rockyStub.opts = { port: port, ws: true, target: 'http://localhost:' + (port + 1) }

    var s = server(rockyStub)

    new WebSocket.Server({ port: port + 1 })
      .on('connection', function connection (ws) {
        ws.on('message', function incoming (message) {
          expect(message).to.be.equal('foo')
          s.close()
          done()
        })
      })

    var ws = new WebSocket('ws://127.0.0.1:' + port)
    ws.on('open', function () {
      ws.send('foo')
    })
  })
})
