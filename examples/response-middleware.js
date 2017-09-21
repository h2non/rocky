const http = require('http')
const rocky = require('..')
const supertest = require('supertest')

// Creates the proxy
const proxy = rocky()

proxy
  .forward('http://localhost:3001')
  // Global response middleware
  .useResponse(function (req, res, next) {
    res.setHeader('Server', 'foo')
    console.log('Modified body 2:', res.body.toString())
    next()
  })

// Configure the route
const route = proxy
  .post('/foo')
  // Replay traffic for the given route
  .replay('http://localhost:3002', { replayOriginalBody: true })
  // Subscribe to the server response to modify the body
  .useResponse(function transformer (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    const body = JSON.parse(res.body.toString())

    // Compose the new body
    res.body = JSON.stringify({ greetings: 'hello ' + body.hello })

    next()
  })
  .useResponse(function (req, res, next) {
    console.log('response:', res.statusCode)
    res.setHeader('Powered-By', 'rocky')
    console.log('Modified body:', res.body.toString())
    next()
  })

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  console.log('Target server reached!')
  res.writeHead(200, { 'Content-Type': 'application/json' })

  var body = ''
  req.on('data', function (chunk) {
    body += chunk
  })
  req.on('end', function () {
    res.write(body)
    res.end()
  })
}).listen(3001)

// Replay server
http.createServer(function (req, res) {
  console.log('Replay server reached!')
  res.writeHead(204)
  res.end()
}).listen(3002)

// setTimeout(function() {}, 10000)
// return false

// Client test request
supertest('http://localhost:3000')
  .post('/foo')
  .send({'hello': 'world'})
  .expect(200)
  .end(function (err, res) {
    console.error(err)
    console.log('Transformed body:', res.body)
  })
