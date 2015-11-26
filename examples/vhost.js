const connect = require('connect')
const rocky = require('..')
const vhost = require('vhost')

// Configure rocky proxies
const mailproxy = rocky()
mailproxy.forward('http://localhost:3001')
mailproxy.all('/*')

const usersproxy = rocky()
usersproxy.forward('http://localhost:3002')
usersproxy.all('/*')

// Plug in the rocky middleware to connect
const mailapp = connect()
mailapp.use(mailproxy.middleware())

const usersapp = connect()
usersapp.use(function (req, res, next) {
  usersproxy.middleware()(req, res, next)
})

// create main app
const app = connect()

// configure vhosts
app.use(vhost('localhost', mailapp))
app.use(vhost('127.0.0.1', usersapp))

app.listen(3000)
console.log('Server listening on port:', 3000)

// Test target servers
const target = connect()
target.listen(3001)
target.use(function (req, res) {
  res.end('Hello from target server 1')
})

const target2 = connect()
target2.listen(3002)
target2.use(function (req, res) {
  res.end('Hello from target server 2')
})
