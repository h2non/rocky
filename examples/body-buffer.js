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
  // Cache all the payload data, if the content type matches
  .bufferBody(/application\/json/i)
  // Replay traffic for the given route
  .replay('http://localhost:3002', { replayOriginalBody: true })
  // Add incoming traffic middleware to intercept and mutate the request
  .use(function (req, res, next) {
    req.headers['Authorization'] = 'Bearer 0123456789'
    next()
  })
  // Add middleware to transform the response
  .use(function transformer(req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(req.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Set the new body
    req.body = newBody
    
    // Continue processing the request
    next()
  })

proxy.listen(3000)
console.log('Server listening on port:', 3000)
