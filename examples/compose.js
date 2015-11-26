const rocky = require('..')
const http = require('http')
const version = require('http-version')
const request = require('supertest')

// Configure rocky proxies
const proxy1 = rocky()
proxy1.forward('http://localhost:3001')
proxy1.all('/*')

const proxy2 = rocky()
proxy2.forward('http://localhost:3002')
proxy2.all('/*')

// create the proxy
const main = rocky()

// Configure the middlewares per specific version
main.use(version('1.0', proxy1.middleware()))
main.use(version('2.0', proxy2.middleware()))

// Start the server
main.listen(3000)

// Target servers
http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3001)

http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3002)

// Test requests
request('http://localhost:3000')
  .get('/test')
  .set('Version', '1.0')
  .end(function (err) {
    if (err) {
      return console.error('Oops:', err)
    }
    console.log('Old API server success')
  })

request('http://localhost:3000')
  .get('/test')
  .set('Version', '2.0')
  .end(function (err) {
    if (err) {
      return console.error('Oops:', err)
    }
    console.log('New API server success')
  })
