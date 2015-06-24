var http = require('http')
var express = require('express')
var rocky = require('../')

var app = express()
var proxy = rocky()

proxy
  .forward('http://httpbin.org')

proxy.get('/headers')
proxy.get('/status/:code')
  .replay('http://localhost:3002')
  .on('error', function (err) {
    console.log('Error:', err)
  })

// Plugin the rocky middleware
app.use(proxy.middleware())

app.get('/test', function (req, res) {
  res.sendStatus(200)
})
// This won't be called
app.get('/status/:code', function (req, res) {
  res.sendStatus(500)
})

app.listen(3000)

// Replay server
express()
  .use(function (req, res) {
    res.sendStatus(503)
  })
  .listen(3002)

// Test request
http.get('http://127.0.0.1:3000/test', function (res) {
  console.log('Status:', res.statusCode)
  res.on('data', function (chunk) {
    console.log('Body: ' + chunk)
  })
})

// Forward request
http.get('http://127.0.0.1:3000/status/204', function (res) {
  console.log('Status:', res.statusCode)
  res.on('data', function (chunk) {
    console.log('Body: ' + chunk)
  })
})
