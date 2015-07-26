const rocky = require('..')
const http = require('http')

// See: https://github.com/h2non/rocky-consul
const consul = require('rocky-consul')

// Create the proxy
const proxy = rocky()

// Plug in the middleware
proxy.use(consul({
  // Servers refresh interval
  interval: 30 * 1000,
  // App service name (required)
  service: 'web',
  // Use a custom datacenter (optional)
  datacenter: 'ams2',
  // Consul servers pool (required)
  servers: [
    'http://demo.consul.io',
    'http://demo.consul.io'
  ]
}))

// Handle all the traffic
proxy.get('/*')

proxy.listen(3000)

console.log('Rocky server listening on port: ' + 3000)

// Test request
http.get('http://localhost:3000/', function (res) {
  console.log('Response status:', res.statusCode)
})
