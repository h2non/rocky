var _ = require('lodash')

module.exports = function routeHandler(rocky, route) {
  // Define custom proxy headers
  route.use(setProxyHeaders)

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

function setProxyHeaders(req, res, next) {
  req.headers['X-Powered-By'] = 'rocky HTTP proxy'
  next()
}
