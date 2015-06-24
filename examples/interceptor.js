var http = require('http')
var rocky = require('..')

// Creates the proxy
var proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Configure the route
var route = proxy
  .get('/users/:id')
  // Add incoming traffic middleware to intercept and mutate the request
  .use(function (req, res, next) {
    req.headers['Authorization'] = 'Bearer 0123456789'
    next()
  })
  // Subscribe to the server response to modify the body
  .transformResponseBody(function transformer(req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(res.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Send the new body in the request
    next(null, newBody)

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
  res.write('{"hello": "world"}')
  res.end()
}).listen(3001)

// Client test request
http.get('http://localhost:3000/users/pepe', function (res) {
  res.setEncoding('utf8')
  res.on('data', function (chunk) {
    // Show the modified response body
    console.log('Body: ' + chunk) // Must be => {"salutation": "hello world"}
  })
})
