const fs = require('fs')
const http = require('http')
const rocky = require('..')
const certPath = __dirname + '/../test/fixtures'

const opts = {
  ssl: {
    key: fs.readFileSync(certPath + '/key.pem', 'utf8'),
    cert: fs.readFileSync(certPath + '/cert.pem', 'utf8')
  }
}

const proxy = rocky(opts)

// Forward to HTTPS server
proxy
  .get('/image/*')
  .options({ secure: false })
  .host('httpbin.org')
  .forward('https://httpbin.org')

// Forward to plain HTTP server
proxy
  .forward('http://localhost:3001')
  .all('/*')

proxy.listen(3443)
console.log('HTTPS server listening on port:', 3443)
console.log('Open: https://localhost:3443/image/jpeg')

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.write('Secure hello world!')
  res.end()
}).listen(3001)
