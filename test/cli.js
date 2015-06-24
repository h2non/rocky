const fs = require('fs')
const http = require('http')
const sinon = require('sinon')
const supertest = require('supertest')
const expect = require('chai').expect
const exec = require('child_process').exec

suite('command-line', function () {
  test('server', function (done) {
    var config = __dirname + '/fixtures/test.toml'
    var cmd = __dirname + '/../bin/rocky --port 8098 --config "' + config + '"'

    var server = createServer(8099)
    var process = startProcess(cmd, assert)

    function assert(stdout) {
      expect(stdout).to.match(/listening on port: 8098/)

      supertest('http://localhost:8098')
        .get('/test')
        .expect(200)
        .expect('Content-Type', 'application/json')
        .expect({ 'hello': 'world' })
        .end(function () {
          process.kill('SIGHUP')
          server.close()
          done()
        })
    }
  })
})

function startProcess(cmd, callback) {
  var process = exec(cmd)

  process.stdout.on('data', function (stdout) {
    callback(stdout)
  })

  return process
}

function createServer(port) {
  var server = http.createServer(function (req, res) {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ 'hello': 'world' }))
    res.end()
  })

  server.listen(port)
  return server
}
