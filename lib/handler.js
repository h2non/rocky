const Dispatcher = require('./dispatcher')

module.exports = function handler(rocky, route) {
  var dispatcher = new Dispatcher(rocky, route)

  // Propagate route events to global event bus
  propagateEvents(rocky, route)

  return function handle(req, res) {
    // Dispatch route handler
    dispatcher.dispatch(req, res)
  }
}

function propagateEvents(rocky, route) {
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
