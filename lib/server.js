const http    = require('http')
const https   = require('https')
const HttpProxy = require('http-proxy')
const errors  = require('./errors')

module.exports = function createServer(rocky) {
  const opts = rocky.opts
  const handler = serverHandler(rocky)

  const server = opts.ssl
    ? https.createServer(opts.ssl, handler.http)
    : http.createServer(handler.http)

  if (opts.ws) {
    server.on('upgrade', function (req, socket, head) {
      handler.ws(req, socket, head)
    })
  }

  server.listen(opts.port, opts.host)
  return server
}

function serverHandler(rocky) {
  const router = rocky.middleware()

  return {
    http: function (req, res) {
      res.setHeader('Server', 'rocky')
      router(req, res, finalHandler)

      function finalHandler(err) {
        if (err) {
          return serverError(rocky, err, req, res)
        }
        notFound(rocky, req, res)
      }
    },

    ws: function (req, socket, head) {
      // To do: call dispatcher
      new HttpProxy(rocky.opts).ws(req, socket, head)
    }
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
