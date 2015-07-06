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

const events = [
  'route:error', 'route:missing',
  'proxy:error', 'replay:start',
  'replay:error', 'error',
  'proxyReq', 'proxyRes'
]

function propagateEvents(rocky, route) {
  events.forEach(function (event) {
    route.on(event, function () {
      var args = [].slice.call(arguments)
      rocky.emit.apply(rocky.emit, [ event ].concat(args))
    })
  })
}
