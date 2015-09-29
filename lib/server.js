const http   = require('http')
const https  = require('https')
const ws     = require('./protocols/ws')
const error  = require('./error')

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
    var dispatcher = new ws.dispatcher(rocky)
    dispatcher.dispatch(req, socket, head, finalHandler)

    function finalHandler(err) {
      if (err) {
        console.error(err)
        socket.end() // sure?
      }
    }
  }

  return {
    http: httpHandler,
    ws: wsHandler
  }
}

function notFound(rocky, req, res) {
  var err = new Error('Route not configured: ' + req.url)
  rocky.emit('route:missing', req, res)
  error.reply(err, res)
}

function serverError(rocky, err, req, res) {
  err.status = +err.status || 500
  rocky.emit('server:error', err, req, res)
  error.reply(err, res)
}
