const http = require('http')
const rocky = require('..')

const proxy = rocky()

// Enable replay after forward mode
proxy
  .replayAfterForward()

proxy
  .forward('http://localhost:3001')
  .replay('http://localhost:3002')
  .replay('http://localhost:3002')

proxy
  .get('/*')

proxy.listen(3000)

// Target servers
http.createServer(function (req, res) {
  console.log('1) Forward server reached')
  setTimeout(function () {
    res.writeHead(200)
    res.end()
  }, 1000)
}).listen(3001)

var times = 0

http.createServer(function (req, res) {
  console.log('3) Then the replay server is reached')
  res.writeHead(204)
  res.end()

  // Exit on complete
  times += 1
  if (times == 2) {
    console.log('Done!')
    process.exit(0)
  }
}).listen(3002)

// Test requests
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('2) Response from target server:', res.statusCode)
})
