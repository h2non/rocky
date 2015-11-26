const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const rocky = require('..')

// Create a WebSocket proxy
const proxy = rocky({ ws: true })
// Or alternatively...
// proxy.protocol('ws')

// Note the URI protocol: 'ws://'
proxy
  .forward('ws://localhost:8989')

// Use a WebSocket traffic middleware
proxy
  .useWs(function (req, socket, head, next) {
    // Do whatever you need here...
    next()
  })

// Finally, listen on network
proxy.listen(3000)

// Target server
const wss = new WebSocketServer({ port: 8989 })
wss.on('connection', function connection (ws) {
  ws.on('message', function incoming (message) {
    console.log('server received: %s', message)
  })
  ws.send('something')
})

// Test client
const ws = new WebSocket('ws://localhost:3000')
ws.on('open', function () {
  ws.send('foo')

  setTimeout(function () {
    ws.send('bar')
  }, 250)

  setTimeout(function () {
    ws.send('far')
  }, 500)
})
ws.on('message', function (data, flags) {
  console.log('client received: %s', data)
})

console.log('Web socket server listening on port: 3000')
