var http = require('http')
var rocky = require('..')
var supertest = require('supertest')

// Creates the proxy
var proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Configure the route
var route = proxy
  .post('/users/:id')
  // Add incoming traffic middleware to intercept and mutate the request
  .use(function (req, res, next) {
    req.headers['Authorization'] = 'Bearer 0123456789'
    next()
  })
  // Add middleware to transform the response
  .transformRequestBody(function transformer(req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(req.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Set the new body
    next(null, newBody, 'utf8')
  })

  // Subscribe to the server response to modify the body
  .transformResponseBody(function transformer(req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(res.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ greetings: body.salutation })

    // Set the new body
    next(null, newBody, 'utf8')

    // Or even you can use write() as well:
    // res.write(newBody)
    // next()
  })

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  // Check if we have a auth
  if (req.headers['authorization'] !== 'Bearer 0123456789') {
    res.writeHead(401)
    return res.end()
  }

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

// Client test request
supertest('http://localhost:3000')
  .post('/users/pepe')
  .send({'hello': 'world'})
  .expect(200)
  .end(function (err, res) {
    console.log('Transformed body:', res.body)
  })
