const http = require('http')
const rocky = require('..')

const proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Add a global middleware
proxy.use(function (req, res, next) {
  console.log('Global middleware:', req.url)
  next()
})

// Configure the specific route for a custom method
proxy
  .get('/users/:id')
  .replay('http://localhost:3001')
  // Add a route-level middleware
  .use(function (req, res, next) {
    console.log('Route middleware:', req.url)
    next()
  })
  .toPath('/users/:id', { id: 'Chuck' })
  .headers({ 'X-Custom': 'blablabla' })

// Then define a generic route handler for other methods
proxy
  .all('/users/:id')
  .use(function (req, res, next) {
    console.log('All methods handler:', req.url)
    res.writeHead(503)
    res.end()
  })

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3001)

// Test requests
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('User status:', res.statusCode)
})

http.get('http://localhost:3000/test', function (res) {
  console.log('Test status:', res.statusCode)
})

const req = http.request({
  method: 'POST',
  hostname: 'localhost',
  path: '/users/pepe',
  port: 3000,
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': 11
  }
}, function (res) {
  console.log('User post:', res.statusCode)
})
req.write('hello world')
req.end()
