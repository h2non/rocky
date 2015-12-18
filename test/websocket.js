const WebSocket = require('ws')
const expect = require('chai').expect
const rocky = require('..')

const ports = { target: 9990, proxy: 9991 }
const baseUrl = 'ws://127.0.0.1'
const proxyUrl = baseUrl + ':' + ports.proxy
const targetUrl = baseUrl + ':' + ports.target

suite('websocket', function () {
  test('simple forward', function (done) {
    var proxy = rocky({ ws: true })
    proxy.forward(targetUrl)
    proxy.listen(ports.proxy)

    var wss = createWebSocketServer(ports.target, function (data, wss) {
      expect(data).to.be.equal('bar')
      wss.send('foo')
    })

    var client = createWebSocketClient(proxyUrl)
    client.on('open', function () {
      client.send('bar')
    })
    client.on('message', function (data, flags) {
      expect(data).to.be.equal('foo')
      close()
    })

    function close () {
      wss.close()
      proxy.close(done)
    }
  })

  test('invalid target', function (done) {
    var proxy = rocky({ ws: true })
    proxy.forward('ws://127.0.0.1:9543')
    proxy.listen(ports.proxy)

    proxy.on('ws:error', function (err) {
      expect(err).to.be.an('array')
      expect(err[0].code).to.be.equal('ECONNREFUSED')
      done()
    })

    var client = createWebSocketClient(proxyUrl)
    client.on('open', function () {
      client.send('bar', function (err) {
        expect(err).to.exists
      })
    })
  })
})

function createWebSocketClient (url, onOpen) {
  var ws = new WebSocket(url)
  ws.on('open', function () {
    if (onOpen) onOpen(ws)
  })
  ws.on('error', function () {})
  return ws
}

function createWebSocketServer (port, onMessage) {
  var wss = new WebSocket.Server({ port: port })
  wss.on('connection', function (ws) {
    ws.on('message', function (message) {
      onMessage(message, ws)
    })
  })
  return wss
}
