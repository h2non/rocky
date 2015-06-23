var http    = require('http')
var https   = require('https')
var version = require('../package.json').version

module.exports = function createServer(opts, router) {
  var handler = serverHandler(router)

  var server = opts.ssl
    ? https.createServer(opts.ssl, handler)
    : http.createServer(handler)

  server.listen(opts.port, opts.host)
  return server
}

function serverHandler(router) {
  return function (req, res) {
    res.setHeader('Server', 'rocky ' + version)
    router(req, res, function (err) {
      if (err) {
        return reply(res, 500, err.message || err)
      }
      reply(res, 404, 'No route configured')
    })
  }
}

function reply(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify({ message: msg }))
  res.end()
}
