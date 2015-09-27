const http    = require('http')
const https   = require('https')
const HttpProxy = require('http-proxy')
const errors  = require('./error')

module.exports = function createServer(rocky) {
  const opts = rocky.opts
  const handler = serverHandler(rocky)

  const server = opts.ssl
    ? https.createServer(opts.ssl, handler.http)
    : http.createServer(handler.http)

  if (opts.ws) server.on('upgrade', handler.ws)

  server.listen(opts.port, opts.host)
  return server
}

function serverHandler(rocky) {
  function httpHandler(req, res) {
    res.setHeader('Server', 'rocky')
    rocky.router(req, res, finalHandler)

    function finalHandler(err) {
      if (err) {
        return serverError(rocky, err, req, res)
      }
      notFound(rocky, req, res)
    }
  }

  function wsHandler(req, socket, head) {
    rocky.mw.run('ws', req, socket, head, function (err) {
      if (err) return socket.end(err)

      var proxy = new HttpProxy(req.rocky.options)

      proxy.on('error', function (err, req, socket) {
        socket.end()
      })

      proxy.ws(req, socket, head)
    })
  }

  return {
    http: httpHandler,
    ws: wsHandler
  }
}

function notFound(rocky, req, res) {
  var err = new Error('Route not configured: ' + req.url)
  rocky.emit('route:missing', req, res)
  errors.reply(err, res)
}

function serverError(rocky, err, req, res) {
  err.status = +err.status || 500
  rocky.emit('server:error', err, req, res)
  errors.reply(err, res)
}
