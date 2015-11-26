const express = require('express')
const rocky = require('..')
const version = require('http-version')
const request = require('supertest')

// Configure rocky proxies
const oldAPIProxy = rocky()
oldAPIProxy.forward('http://localhost:3001')
oldAPIProxy.all('/*')

const newAPIProxy = rocky()
newAPIProxy.forward('http://localhost:3002')
newAPIProxy.all('/*')

// create main app
const app = express()

// Configure the middlewares per specific version
app.use(version('1.0', oldAPIProxy.middleware()))
app.use(version('2.0', newAPIProxy.middleware()))

// Start the server
app.listen(3000)

// Test target servers
const oldAPIServer = express()
oldAPIServer.use(function (req, res) {
  res.end('Hello from old API')
})
oldAPIServer.listen(3001)

const newAPIServer = express()
newAPIServer.use(function (req, res) {
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
