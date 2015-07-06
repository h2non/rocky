const http    = require('http')
const https   = require('https')
const version = require('../package.json').version

module.exports = function createServer(opts, rocky) {
  const handler = serverHandler(rocky)

  var server = opts.ssl
    ? https.createServer(opts.ssl, handler)
    : http.createServer(handler)

  server.listen(opts.port, opts.host)
  return server
}

function serverHandler(rocky) {
  const router = rocky.middleware()
  return function (req, res) {
    res.setHeader('Server', 'rocky ' + version)

    router(req, res, function (err) {
      if (err) {
        rocky.emit('server:error', err, req, res)
        return reply(res, 500, err.message || err)
      }

      const msg = 'No route configured'
      rocky.emit('route:missing', req, res)
      reply(res, 502, msg)
    })
  }
}

function reply(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify({ message: msg }))
  res.end()
}
