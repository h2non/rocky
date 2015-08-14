var fs = require('fs')
var http = require('http')
var rocky = require('..')
var certPath = __dirname + '/../test/fixtures'

var opts = {
  ssl: {
    key: fs.readFileSync(certPath + '/key.pem', 'utf8'),
    cert: fs.readFileSync(certPath + '/cert.pem', 'utf8')
  }
}

var proxy = rocky(opts)

proxy
  .forward('http://localhost:3001')
  .all('/*')

proxy.listen(3000)
console.log('HTTPS server listening on port:', 3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.write('Secure hello world!')
  res.end()
}).listen(3001)
