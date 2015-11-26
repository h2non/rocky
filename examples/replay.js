const http = require('http')
const rocky = require('..')

const proxy = rocky()

// Forward to an invalid server
proxy
  .forward('http://invalid:9321')

// Configure the replay servers
proxy
  .replay('http://localhost:3002')
  .replay('http://localhost:3003')

proxy
  .get('/*')

proxy.listen(3000)

http.createServer(function (req, res) {
  setTimeout(function () {
    console.log('Replay server 1 reached!')
    res.writeHead(204)
    res.end()
  }, 1000)
}).listen(3002)

http.createServer(function (req, res) {
  setTimeout(function () {
    console.log('Replay server 2 reached!')
    res.writeHead(204)
    res.end()
  }, 1000)
}).listen(3003)

// Test requests
http.get('http://localhost:3000/', function (res) {
  console.log('Response from target server:', res.statusCode)
})
