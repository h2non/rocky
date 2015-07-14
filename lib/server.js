const http    = require('http')
const https   = require('https')
const errors  = require('./errors')
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
        err.status = 500
        rocky.emit('server:error', err, req, res)
        return errors.replyWithError(err, res)
      }

      err = new Error('No route configured')
      rocky.emit('route:missing', req, res)
      errors.replyWithError(err, res)
    })
  }
}

