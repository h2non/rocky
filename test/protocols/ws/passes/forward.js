const http = require('http')
const expect = require('chai').expect
const WebSocket = require('ws')
const forward = require('../../../../lib/protocols/ws/passes/forward')

const port = 8099
const targetPort = 8090

suite('forward', function () {
  test('valid', function (done) {
    var server = createServer(port, onUpgrade)
    var wss = createWebSocketServer(targetPort)
    var opts = { target: 'http://localhost:' + targetPort }
    createWebSocketClient('http://localhost:' + port)

    function onUpgrade (req, socket, head) {
      forward(opts, req, socket, head, assert)
    }

    function assert (err) {
      expect(err).to.not.exists
      wss.close()
      server.close(done)
    }
  })
})

function createWebSocketClient (url, onOpen) {
  var ws = new WebSocket(url)
  ws.on('open', function () {
    if (onOpen) onOpen(ws)
  })
  return ws
}

function createWebSocketServer (port, onMessage) {
  var wss = new WebSocket.Server({ port: port })
  wss.on('connection', function (ws) {
    ws.on('message', function (message) {
      if (onMessage) onMessage(message, ws)
    })
  })
  return wss
}

function createServer (port, wsHandler) {
  const server = http.createServer(function (req, res) {
    res.end()
  })
  server.on('upgrade', wsHandler)
  server.listen(port)
  return server
}
