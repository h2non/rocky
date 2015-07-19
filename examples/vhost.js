var connect = require('connect')
var rocky = require('..')
var vhost = require('vhost')

// Configure rocky proxies
var mailproxy = rocky()
mailproxy.forward('http://localhost:3001')
mailproxy.all('/*')

var usersproxy = rocky()
usersproxy.forward('http://localhost:3002')
usersproxy.all('/*')

// Plug in the rocky middleware to connect
var mailapp = connect()
mailapp.use(mailproxy.middleware())

var usersapp = connect()
usersapp.use(function (req, res, next) {
  usersproxy.middleware()(req, res, next)
})

// create main app
var app = connect()

// configure vhosts
app.use(vhost('localhost', mailapp))
app.use(vhost('127.0.0.1', usersapp))

app.listen(3000)

// Test target servers
var target = connect()
target.listen(3001)
target.use(function (res, res) {
  res.end('Hello from target server 1')
})

var target2 = connect()
target2.listen(3002)
target2.use(function (res, res) {
  res.end('Hello from target server 2')
})
