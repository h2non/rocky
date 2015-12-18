const router = require('router')
const Route = require('./route')
const Base = require('./base')
const server = require('./server')
const assign = require('lodash').assign
const toArray = require('./helpers').toArray
const routeHandler = require('./protocols/http/route-handler')

module.exports = Rocky

/**
 * Rocky implements an HTTP and WebSocket proxy with built-in router
 * and hierarchical middleware layer.
 *
 * @param {Object} opts
 * @class Rocky
 * @extend Base
 * @constructor
 */

function Rocky (opts) {
  if (!(this instanceof Rocky)) return new Rocky(opts)
  opts = opts || {}
  Base.call(this, opts)

  this.server = null
  this.router = router(opts.router)
  this._setupMiddleware()
}

Rocky.prototype = Object.create(Base.prototype)

/**
 * Define the proxy networking protocol.
 * Allowed protocols are `ws` and `http`. Defaults to `http`.
 *
 * @param {String} name
 * @return {Rocky}
 * @method protocol
 */

Rocky.prototype.protocol = function (name) {
  if (name === 'ws') this.opts.ws = true
  return this
}

/**
 * Attaches an middleware function to the HTTP incoming traffic phase.
 * Middleware will be globally executed and applies to any
 * HTTP request handled by the server.
 *
 * @param {String} path
 * @method use
 * @alias useIncoming
 * @return {Rocky}
 */

Rocky.prototype.use =
Rocky.prototype.useIncoming = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

/**
 * Attaches a path param based middleware function.
 * Middleware will be executed every time the given path
 * param is matched by the router.
 *
 * @param {String} param
 * @param {Function} middleware
 * @method param
 * @alias useParam
 * @return {Rocky}
 */

Rocky.prototype.param =
Rocky.prototype.useParam = function (param, middleware) {
  this.router.param.apply(this.router, arguments)
  return this
}

/**
 * Attaches a middleware function for websocket data frames.
 * Only dispatched for websocket proxies.
 *
 * @param {Function} middleware
 * @return {Rocky}
 * @method useWs
 * @return {Rocky}
 */

Rocky.prototype.useWs = function (middleware) {
  this.useFor('ws', arguments)
  return this
}

/**
 * Exposes a connect/express compatible middleware function.
 *
 * @return {Function}
 * @method middleware
 */

Rocky.prototype.middleware = function () {
  return this.requestHandler.bind(this)
}

/**
 * Middleware function handler for incoming HTTP traffic.
 * This function will be triggered by the rocky router.
 *
 * Except in very specific scenarios, you don't need to use this method.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Function} next
 * @return {Rocky}
 * @method requestHandler
 */

Rocky.prototype.requestHandler = function (req, res, next) {
  this.router(req, res, next || function () {})
  return this
}

/**
 * Start listening on the network, optionally passing a
 * TCP port number and/or host to bind the connection.l
 *
 * @param {Number} port
 * @param {String} host
 * @return {Rocky}
 * @method listen
 */

Rocky.prototype.listen = function (port, host) {
  const opts = this.opts
  if (port) opts.port = port
  if (host) opts.host = host
  if (opts.ws) this.routeAll()
  this.server = server(this)
  return this
}

/**
 * Stop the server, optionally passing a callback to handle the status.
 *
 * @param {Function} done
 * @return {Rocky}
 * @method close
 */

Rocky.prototype.close = function (done) {
  if (this.server) {
    this.server.close(function (err) {
      this.server = null
      if (done) done(err)
    }.bind(this))
  }
  return this
}

/**
 * Route all the incoming HTTP traffic for any route and any HTTP verb.
 *
 * @return {Route}
 * @method routeAll
 */

Rocky.prototype.routeAll = function () {
  return this.all('/*')
}

/**
 * Creates a new route for the given HTTP verb and path.
 * For better convenience you can use the verb specific method shortcuts.
 *
 * @param {String} method
 * @param {String} path
 * @return {Route}
 * @method route
 */

Rocky.prototype.route = function (method, path) {
  const route = new Route(path)
  route.proxy = this

  const handler = routeHandler(this, route)
  const middleware = [].slice.call(arguments, 1)
  const args = middleware.concat([ handler ])

  this.router[method.toLowerCase()].apply(this.router, args)
  return route
}

/**
 * Creates a new HTTP route for GET requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method get
 * @name get
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for POST requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method post
 * @name post
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for PUT requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method put
 * @name put
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for DELETE requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method delete
 * @name delete
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for PATCH requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method patch
 * @name patch
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for HEAD requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method head
 * @name head
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for TRACE requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method trace
 * @name trace
 * @memberof Rocky
 * @instance
 */

/**
 * Creates a new HTTP route for any verb requests and the given path.
 *
 * @param {String} path
 * @return {Route}
 * @method all
 * @name all
 * @memberof Rocky
 * @instance
 */

;['get', 'post', 'delete', 'patch', 'put', 'head', 'trace', 'all'].forEach(function (method) {
  Rocky.prototype[method] = function (path) {
    const args = [ method ].concat(toArray(arguments))
    return this.route.apply(this, args)
  }
})

/**
 * Set up generic built-in middleware function to the middleware stack.
 *
 * @method _setupMiddleware
 * @private
 */

Rocky.prototype._setupMiddleware = function () {
  const rocky = this

  function middleware (req, res) {
    const next = arguments[arguments.length - 1]
    const opts = assign({}, rocky.opts)
    req.rocky = { proxy: rocky, options: opts }
    next()
  }

  if (rocky.opts.ws) {
    return rocky.mw.use('ws', middleware)
  }

  rocky.router.use(middleware)
}
