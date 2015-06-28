var express = require('express')
var rocky = require('rocky')
var version = require('http-version')
var request = require('supertest')

// Configure rocky proxies
var oldAPIProxy = rocky()
oldAPIProxy.forward('http://localhost:3001')
oldAPIProxy.all('/*')

var newAPIProxy = rocky()
newAPIProxy.forward('http://localhost:3002')
newAPIProxy.all('/*')

// create main app
var app = express()

// Configure the middlewares per specific version
app.use(version('1.0', oldAPIProxy.middleware()))
app.use(version('2.0', newAPIProxy.middleware()))

// Start the server
app.listen(3000)

// Test target servers
var oldAPIServer = express()
oldAPIServer.use(function (res, res) {
  res.end('Hello from old API')
})
oldAPIServer.listen(3001)

var newAPIServer = express()
newAPIServer.use(function (res, res) {
  res.end('Hello from new API')
})
newAPIServer.listen(3002)

// Test requests
request('http://localhost:3000')
  .get('/test')
  .set('Version', '1.0')
  .expect(200, 'Hello from old API')
  .end(function (err) {
    if (err) {
      return console.error('Oops:', err)
    }
    console.log('Old API server success')
  })

request('http://localhost:3000')
  .get('/test')
  .set('Version', '2.0')
  .expect(200, 'Hello from new API')
  .end(function (err) {
    if (err) {
      return console.error('Oops:', err)
    }
    console.log('New API server success')
  })
