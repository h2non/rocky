const fs = require('fs')
const expect = require('chai').expect
const supertest = require('supertest')
const server = require('../../lib/http/server')

const port = 8099
const fixtures = __dirname + '/../fixtures'

suite('server', function () {
  var rockyStub = {
    middleware: function () {
      return reply
    }
  }

  function reply(req, res) {
    res.statusCode = 201
    res.setHeader('foo', 'bar')
    res.end('foo')
  }

  test('listen', function (done) {
    var s = server({ port: port }, rockyStub)

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

    var s = server({ port: port, ssl: ssl }, rockyStub)

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
})
