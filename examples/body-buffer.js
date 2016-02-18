const rocky = require('..')

// Creates the proxy
const proxy = rocky()

proxy
  .forward('http://localhost:3001')

// Configure the route
proxy
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
  .use(function transformer (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    const json = req.json

    // Or alternatively you get and parse the buffer as JSON
    const body = JSON.parse(req.body.toString())

    // Compose the new body
    const newJSON = { salutation: 'hello ' + json.hello }
    const newBody = JSON.stringify(newJSON)

    // Update the pre-parsed JSON for subsequent middleware functions
    req.json = newJSON

    // IMPORTANT: set the new body (must be a string or buffer)
    req.body = newBody

    // Continue processing the request
    next()
  })

proxy.listen(3000)
console.log('Server listening on port:', 3000)
