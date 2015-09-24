const http    = require('http')
const https   = require('https')
const errors  = require('../errors')

module.exports = function createServer(opts, rocky) {
  const handler = serverHandler(rocky)

  const server = opts.ssl
    ? https.createServer(opts.ssl, handler)
    : http.createServer(handler)

  server.listen(opts.port, opts.host)
  return server
}

function serverHandler(rocky) {
  const router = rocky.middleware()
  return function (req, res) {
    res.setHeader('Server', 'rocky')
    router(req, res, finalHandler)

    function finalHandler(err) {
      if (err) {
        return serverError(rocky, err, req, res)
      }
      notFound(rocky, req, res)
    }
  }
}

function notFound(rocky, req, res) {
  var err = new Error('Route not configured: ' + req.url)
  rocky.emit('route:missing', req, res)
  errors.replyWithError(err, res)
}

function serverError(rocky, err, req, res) {
  err.status = +err.status || 500
  rocky.emit('server:error', err, req, res)
  errors.replyWithError(err, res)
}
