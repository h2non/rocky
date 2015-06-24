var http = require('http')
var rocky = require('../')

var proxy = rocky()

proxy
  .balance([
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ])

// Configure rocky
proxy.get('/users/:id')

// Start the proxy and listen
proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '1' })
  res.end()
}).listen(3001)

http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '2' })
  res.end()
}).listen(3002)

http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '3' })
  res.end()
}).listen(3003)

// Test request
for (var i = 0; i < 10; i += 1) {
  setTimeout(doRequest, Math.random() * 5)
}

function doRequest() {
  http.get('http://localhost:3000/users/pepe', function (res) {
    console.log('Status:', res.statusCode, 'from server:', res.headers.server)
  })
}
