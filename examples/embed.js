var http = require('http')
var rocky = require('../')

var proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Configure rocky
proxy.get('/users/:id')
  .on('request', function (opts) {
    console.log('Request:', opts)
  })
  .on('error', function (err) {
    console.log('Error:', err)
  })

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3001)

// Test request
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('Status:', res.statusCode)

  res.on('data', function (chunk) {
    console.log('Body: ' + chunk)
  })
})
