const http = require('http')
const rocky = require('..')

const proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Subscribe to global events
proxy
  .on('proxyReq', function (proxyReq, req, res, opts) {
    console.log('Proxy request:', req.url, 'to', opts.target)
  })
  .on('proxyRes', function (proxyRes, req, res) {
    console.log('Proxy response:', req.url, 'with status', res.statusCode)
  })
  .on('proxy:error', function (err, req, res) {
    console.log('Proxy error:', err)
  })

// Add a global middleware
proxy.use(function (req, res, next) {
  console.log('Global middleware:', req.url)
  next()
})

// Configure the route
const route = proxy
  .get('/users/:id')

// Subscribe to route-level events
route
  .on('proxyReq', function (proxyReq, req, res, opts) {
    console.log('Proxy request:', req.url, 'to', opts.target)
  })
  .on('proxyRes', function (proxyRes, req, res) {
    console.log('Proxy response:', req.url, 'with status', res.statusCode)
  })
  .on('proxy:error', function (err, req, res) {
    console.log('Proxy error:', err)
  })
  .on('route:error', function (err, req, res) {
    console.log('Route error:', err)
  })
  .on('replay:start', function (params, opts, req) {
    console.log('Replay request:', params, '=>', opts.target, '=> URL:', req.url)
  })
  .on('replay:error', function (err, req) {
    console.log('Replay error:', err, req.url)
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
