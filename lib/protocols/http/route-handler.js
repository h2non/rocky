const Dispatcher = require('./dispatcher')
const toArray = require('../../helpers').toArray

exports = module.exports = routeHandler

const middleware = exports.middleware = [
  'forward',
  'replay',
  'response'
]

const events = exports.events = [
  'error', 'proxyReq', 'proxyRes',
  'route:error', 'route:missing',
  'proxy:response', 'proxy:retry',
  'proxy:error', 'replay:start',
  'replay:error', 'replay:end',
  'replay:stop', 'replay:retry'
]

function routeHandler(rocky, route) {
  const dispatcher = new Dispatcher(rocky, route)

  // Expose the dispatcher in the route instance, useful for hacking purposes
  route.dispatcher = dispatcher

  // Propagate route events to the global event bus
  propagateEvents(rocky, route)

  // Propagate middleware to global scope
  propagateMiddleware(rocky, route)

  return dispatcher.dispatch.bind(dispatcher)
}

function propagateEvents(rocky, route) {
  events.forEach(function (event) {
    route.on(event, function () {
      const args = toArray(arguments)
      rocky.emit.apply(rocky, [ event ].concat(args))
    })
  })
}

function propagateMiddleware(rocky, route) {
  middleware.forEach(function (type) {
    route.useFor(type, function (req, res, next) {
      rocky.mw.run(type, req, res, next)
    })
  })
}
