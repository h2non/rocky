const http = require('http')
const rocky = require('..')
const supertest = require('supertest')

// Creates the proxy
const proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Configure the route
const route = proxy
  .post('/users/:id')
  // Replay traffic for the given route
  .replay('http://localhost:3002', { replayOriginalBody: true })
  // Add incoming traffic middleware to intercept and mutate the request
  .use(function (req, res, next) {
    req.headers['Authorization'] = 'Bearer 0123456789'
    next()
  })
  .use(function (req, res, next) {
    if (req.params.id.length < 2) {
      console.log('Invalid ID param')
    }
    next()
  })

  // Incercept and transform the request body
  .transformRequestBody(function transformer (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    const body = JSON.parse(req.body.toString())

    // Or alternatively you can use the already parsed JSON
    const json = req.json

    // Compose the new body
    const newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Set the new body (must be a string or buffer)
    next(null, newBody, 'utf8')
  }, function (req) {
    // Custom filter
    return /application\/json/i.test(req.headers['content-type'])
  })

  // Intercept and transform the server response before send it to the client
  .transformResponseBody(function transformer (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    const body = JSON.parse(res.body.toString())

    // Or alternatively you can use the already parsed JSON
    const json = res.json

    // Compose the new body
    const newBody = JSON.stringify({ greetings: body.salutation })

    // Set the new body (must be a string or buffer)
    next(null, newBody, 'utf8')

  // Or even you can use write() as well:
  // res.write(newBody)
  // next()
  }, function (res) {
    // Custom filter
    return /application\/json/i.test(res.getHeader('content-type'))
  })

proxy.all('/*')

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  // Check if the request is authorized
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

// Replay server
http.createServer(function (req, res) {
  // Check if we have a auth
  if (req.headers['authorization'] !== 'Bearer 0123456789') {
    res.writeHead(401)
    return res.end()
  }

  res.writeHead(204)
  res.end('Hello from replay server')
}).listen(3002)

// Client test request
supertest('http://localhost:3000')
  .post('/users/pepe')
  .send({'hello': 'world'})
  .expect(200)
  .end(function (err, res) {
    console.log('Transformed body:', res.body)
  })
