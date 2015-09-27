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
  .useWs(function (req, socket, head, next) {
    var payload = new Buffer('Hello world')
    var meta = frameMetadata(true, 10, false, payload)
    var data = Buffer.concat([meta, payload], meta.length + payload.length)
    //socket.write(data)
    next()
  })

proxy
  .get('/*')

proxy.listen(3000)

// Target server
var wss = new WebSocketServer({ port: 8989 })

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('server received: %s', message)
  })
  ws.send('something')
})

var ws = new WebSocket('ws://localhost:3000')

ws.on('open', function () {
  ws.send('foo')
})

ws.on('message', function (data, flags) {
  console.log('client received: %s', data)
})

console.log('Web socket server listening on port: 3000')

/**
 * Creates the meta-data portion of the frame
 * If the frame is masked, the payload is altered accordingly
 * @param {boolean} fin
 * @param {number} opcode
 * @param {boolean} masked
 * @param {Buffer} payload
 * @returns {Buffer}
 * @private
 */

function frameMetadata(fin, opcode, masked, payload) {
  var len, meta, start, mask, i

  len = payload.length

  // Creates the buffer for meta-data
  meta = new Buffer(2 + (len < 126 ? 0 : (len < 65536 ? 2 : 8)) + (masked ? 4 : 0))

  // Sets fin and opcode
  meta[0] = (fin ? 128 : 0) + opcode

  // Sets the mask and length
  meta[1] = masked ? 128 : 0
  start = 2
  if (len < 126) {
    meta[1] += len
  } else if (len < 65536) {
    meta[1] += 126
    meta.writeUInt16BE(len, 2)
    start += 2
  } else {
    // Warning: JS doesn't support integers greater than 2^53
    meta[1] += 127
    meta.writeUInt32BE(Math.floor(len / Math.pow(2, 32)), 2)
    meta.writeUInt32BE(len % Math.pow(2, 32), 6)
    start += 8
  }

  // Set the mask-key
  if (masked) {
    mask = new Buffer(4)
    for (i = 0; i < 4; i++) {
      meta[start + i] = mask[i] = Math.floor(Math.random() * 256)
    }
    for (i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4]
    }
    start += 4
  }

  return meta
}
