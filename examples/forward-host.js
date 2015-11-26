const rocky = require('..')

// Creates the proxy with custom options
const proxy = rocky({ forwardHost: true })

// By default forward all the traffic to httpbin.org
proxy
  .forward('http://httpbin.org')

// Configure a custom route
proxy
  .get('/foo')
  // Forward to another server for this route
  .forward('http://example.com')
  // Overwrite the host header for this route
  // This uses internally a simple middleware
  .host('example.com')

// Route all the incoming traffic to the default target
proxy.routeAll()

proxy.listen(3000)
console.log('Server listening on port:', 3000)
