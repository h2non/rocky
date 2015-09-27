var WebSocket = require('ws')
var WebSocketServer = WebSocket.Server
var rocky = require('..')

var proxy = rocky({ ws: true })

// Enable replay after forward mode
proxy
  .replayAfterForward()

proxy
  .forward('ws://localhost:8989')

proxy
  .get('/*')

proxy.listen(3000)

// Target server
var wss = new WebSocketServer({ port: 8989 })

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message)
  })
  ws.send('something')
})

var ws = new WebSocket('ws://localhost:3000')

ws.on('open', function () {
  ws.send('foo')
})

ws.on('message', function (data, flags) {
  console.log('received: %s', data)
})

console.log('Web socket server listening on port: 3000')
