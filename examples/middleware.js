const http = require('http')
const rocky = require('..')

const proxy = rocky({ })

proxy
  .forward('http://localhost:3001')

// Add a global middleware
proxy.use(function (req, res, next) {
  console.log('Global middleware:', req.url)
  next()
})

proxy.useParam('id', function (req, res, next) {
  console.log('Route with param "id":', req.url)
  next()
})

// Configure the route
proxy
  .get('/users/:id')
  .replay('http://localhost:3001')
  // Add a route-level middleware
  .use(function (req, res, next) {
    console.log('Route middleware:', req.url)
    next()
  })
  // Define a replay only middleware
  .useReplay(function (req, res, next) {
    req.headers['X-Replay-Id'] = '0123456789'
    next()
  })
  // Define a forward request only middleware
  .useForward(function (req, res, next) {
    req.headers['X-Forward-Id'] = '123456789'
    next()
  })
  .toPath('/users/:id', { id: 'Chuck' })
  .host('http://google.com')
  .headers({
    'X-Custom': 'blablabla'
  })
  .query({
    'foo': 'bar'
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
