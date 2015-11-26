const http = require('http')
const rocky = require('..')

const proxy = rocky()

// Enable replay sequentially
proxy
  .replaySequentially()

proxy
  .forward('http://localhost:3001')
  .replay('http://localhost:3002')
  .replay('http://localhost:3002')
  .replay('http://localhost:3002')

proxy
  .get('/*')

proxy.listen(3000)

// Target servers
http.createServer(function (req, res) {
  setTimeout(function () {
    console.log('1) Forward server reached')
    res.writeHead(200)
    res.end()
  }, 100)
}).listen(3001)

http.createServer(function (req, res) {
  setTimeout(function () {
    console.log('3) Then the replay server is reached')
    res.writeHead(204)
    res.end()
  }, 1000)
}).listen(3002)

// Test requests
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('2) Response from target server:', res.statusCode)
})
