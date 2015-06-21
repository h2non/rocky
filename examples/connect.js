var http = require('http')
var connect = require('connect')
var rocky = require('../')

var app = connect()
var migrate = rocky()

migrate
  .forward('http://localhost:3001')

migrate.get('/users/:id')
  .replay('http://localhost:3002')
  .replay('http://localhost:3002')
  .on('request', function (opts) {
    console.log('Request:', opts)
  })
  .on('error', function (err) {
    console.log('Error:', err)
  })

app.use(migrate.middleware())
app.listen(3000)

// Target server
connect()
  .use(function (req, res) {
    res.end('Hello World!')
  })
  .listen(3001)

// Replay server
connect()
  .use(function (req, res) {
    console.log('Not found')
    res.statusCode = 404
    res.end()
  })
  .listen(3002)

// Test request
http.get('http://localhost:3000/users/pepe', function (res) {
  console.log('Status:', res.statusCode)

  res.on('data', function (chunk) {
    console.log('Body: ' + chunk)
  })
})
