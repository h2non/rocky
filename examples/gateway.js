var rocky = require('..')
var http = require('http')
var request = require('supertest')

var proxyUrl = 'http://localhost:3000'
var usersServiceUrl = 'http://localhost:3001'
var securityServiceUrl = 'http://localhost:3002'
var logServiceUrl = 'http://localhost:3003'

// Create the proxy
var proxy = rocky().listen(3000)

// Configure the gateway
proxy
  .all('/users/*')
  .forward(usersServiceUrl)
  .replay(logServiceUrl)

proxy
  .all('/security/*')
  .forward(securityServiceUrl)
  .replay(logServiceUrl)

/**
 * Create test service servers
 */

// Users
http.createServer(function (req, res) {
  console.log('Users server reached!')
  res.writeHead(200)
  res.end()
}).listen(3001)

// Security
http.createServer(function (req, res) {
  console.log('Security server reached!')
  res.writeHead(401)
  res.end()
}).listen(3002)

// Log
http.createServer(function (req, res) {
  console.log('Log server reached!')
  res.writeHead(204)
  res.end()
}).listen(3003)

// Test requests
request(proxyUrl)
  .get('/users/me')
  .expect(200)
  .end(function (err, res) {
    console.log('Users server response:', res.statusCode)
  })

request(proxyUrl)
  .get('/security/auth')
  .expect(401)
  .end(function (err, res) {
    console.log('Security server response:', res.statusCode)
  })
