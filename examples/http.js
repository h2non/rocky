var http = require('http')
var rocky = require('../')

var proxy = rocky()

proxy
  .forward('http://localhost:3001')

proxy.get('/users/:id')

// Create the forward server
http.createServer(function (req, res) {
  proxy.requestHandler(req, res, function (err) {
    var code = err ? 500 : 404
    res.writeHead(code)
    res.end()
  })
}).listen(3000)

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
