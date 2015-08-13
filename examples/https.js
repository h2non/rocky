var fs = require('fs')
var http = require('http')
var rocky = require('..')

var opts = {
  ssl: {
    key: fs.readFileSync('valid-ssl-key.pem', 'utf8'),
    cert: fs.readFileSync('valid-ssl-cert.pem', 'utf8')
  }
}

var proxy = rocky(opts)

proxy
  .forward('http://localhost:3001')
  .all('/*')

proxy.listen(3000)

// Target server
http.createServer(function (req, res) {
  res.writeHead(200)
  res.end()
}).listen(3001)
