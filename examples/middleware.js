var http = require('http')
var rocky = require('..')

var proxy = rocky()

proxy
  .forward('http://localhost:3001')

proxy.use(function (req, res, next) {
  console.log('Generic middleware:', req.url)
  next()
})

// Configure the route
proxy
  .get('/users/:id')
  // Add a route-level middleware
  .use(function (req, res, next) {
    console.log('Route middleware:', req.url)
    next()
  })

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3001)

// Test request
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('User status:', res.statusCode)
})

http.get('http://localhost:3000/test', function (res) {
  console.log('Test status:', res.statusCode)
})
