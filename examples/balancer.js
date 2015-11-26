const http = require('http')
const rocky = require('..')

const proxy = rocky()

proxy
  .balance([
    'http://localhost:3100',
    'http://localhost:3101',
    'http://localhost:3102'
  ])

// Configure rocky
proxy.get('/users/:id')

// Start the proxy and listen
proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '1' })
  res.end()
}).listen(3100)

http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '2' })
  res.end()
}).listen(3101)

http.createServer(function (req, res) {
  res.writeHead(200, { 'Server': '3' })
  res.end()
}).listen(3102)

// Test request
for (var i = 0; i < 10; i += 1) {
  setTimeout(doRequest, Math.random() * 100)
}

function doRequest () {
  http.get('http://localhost:3000/users/pepe', function (res) {
    console.log('Status:', res.statusCode, 'from server:', res.headers.server)
  })
}
