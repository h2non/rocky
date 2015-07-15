const Dispatcher = require('./dispatcher')

const events = [
  'error', 'proxyReq', 'proxyRes',
  'route:error', 'route:missing',
  'proxy:error', 'replay:start',
  'replay:error', 'replay:end',
  'replay:stop'
]

module.exports = function handler(rocky, route) {
  const dispatcher = new Dispatcher(rocky, route)

  // Propagate route events to global event bus
  propagateEvents(rocky, route)

  // Propagate middleware to global one
  propagateMiddleware(rocky, route)

  return function handle(req, res) {
    dispatcher.dispatch(req, res)
  }
}

function propagateEvents(rocky, route) {
  events.forEach(function (event) {
    route.on(event, function () {
      const args = [].slice.call(arguments)
      rocky.emit.apply(rocky, [ event ].concat(args))
    })
  })
}

function propagateMiddleware(rocky, route) {
  ['forward', 'replay'].forEach(function (type) {
    route.useFor(type, function (req, res, next) {
      rocky.mw.run(type, req, res, next)
    })
  })
}
