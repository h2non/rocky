const rocky = require('..')

// Creates the proxy
const proxy = rocky()

proxy
  .forward('http://httpbin.org')

// Configure the route
const route = proxy
  .get('/*')
  // Cache all the payload data, if the content type matches
  .bufferBody(/application\/json/i)
  // Add middleware to transform the response
  .transformResponse(function (req, res, next) {
    // The response body will be available uncompressed and as raw string
    // then you can just parse the body (assuming it's a JSON)
    const body = JSON.parse(res.body)

    // If you need to handle with the original gzipped buffer
    // you have it available in: res._originalBody

    // Mutate the body
    body.server = 'rocky'

    // Use the new body. It must be an string or buffer
    res.body = JSON.stringify(body)

    // Continue processing the request
    next()
  })

proxy.listen(3000)
console.log('Server listening on port:', 3000)
console.log('Test URL: http://localhost:3000/gzip')
