var _ = require('lodash')

module.exports = function routeHandler(rocky, route) {
  // Add the default middleware
  route.use(proxyHeadersMiddleware)

  // Forward route events to parent emitter
  eventsProxy(rocky, route)

  return function handler(req, res) {
    var opts = _.clone(rocky.opts)
    opts.replays = rocky.replays

    // Call the route handler
    route.handle(opts, req, res)
  }
}

function eventsProxy(rocky, route) {
  route.on('proxyReq', function (proxyReq, req, res, opts) {
    rocky.emit('proxyReq', proxyReq, req, res, opts)
  })
  route.on('proxyRes', function (proxyRes, req, res) {
    rocky.emit('proxyRes', proxyRes, req, res)
  })
  route.on('error', function (err, req, res) {
    rocky.emit('error', err, req, res)
  })
}

function proxyHeadersMiddleware(req, res, next) {
  var headers = req.headers
  headers['X-Powered-By'] = 'rocky HTTP proxy'

  var protocol = headers['x-forwarded-proto'] || req.protocol
  if (protocol) headers['x-forwarded-proto'] = protocol

  var remote = headers['x-forwarded-for'] || req.connection.remoteAddress
  if (remote) headers['x-forwarded-for'] = remote

  var host = headers['x-forwarded-host'] || headers.host
  if (host) headers['x-forwarded-host'] = host

  next()
}
