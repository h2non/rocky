const http = require('http')
const express = require('express')
const rocky = require('..')

const app = express()
const proxy = rocky()

proxy
  .forward('http://httpbin.org')

proxy.get('/headers')
  .replay('http://localhost:3001')

proxy.get('/status/:code')
  .replay('http://localhost:3002')
  .options({ timeout: 3000, forwardHost: true, forwardOriginalBody: true })
  .on('proxy:error', function (err) {
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

// Replay servers
express()
  .use(function (req, res) {
    res.sendStatus(503)
  })
  .listen(3001)

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
