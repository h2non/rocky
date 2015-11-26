const http = require('http')
const connect = require('connect')
const rocky = require('..')

const app = connect()
const proxy = rocky()

// Configure the proxy and routes
proxy
  .forward('http://localhost:3001')

proxy
  .get('/*')
  .replay('http://localhost:3002')
  .replay('http://localhost:3002')
  .on('request', function (opts) {
    console.log('Request:', opts)
  })
  .on('error', function (err) {
    console.log('Error:', err)
  })

// Plug in rocky middleware in connect
app.use(proxy.middleware())
app.listen(3000)

// Target server
connect()
  .use(function (req, res) {
    console.log('Target server reached')
    res.end('Hello World!')
  })
  .listen(3001)

// Replay server
connect()
  .use(function (req, res) {
    console.log('Replay server reached')
    res.statusCode = 404
    res.end()
  })
  .listen(3002)

// Test request
http.get('http://localhost:3000/', function (res) {
  console.log('Response status:', res.statusCode)

  res.on('data', function (chunk) {
    console.log('Body: ' + chunk)
  })
})
