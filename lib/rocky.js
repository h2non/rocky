const router       = require('router')
const Route        = require('./route')
const createServer = require('./server')
const routeHandler = require('./handler')
const assign       = require('lodash').assign
const Emitter      = require('events').EventEmitter
const MwPool       = require('./mwpool')

module.exports = Rocky

function Rocky(opts) {
  opts = opts || { xfwd: true }
  this.replays = []
  this.opts    = opts
  this.mw      = new MwPool
  this.router  = router(opts.router)

  setupMiddleware(this)
  Emitter.call(this)
}

Rocky.prototype = Object.create(Emitter.prototype)

Rocky.prototype.target  =
Rocky.prototype.forward = function (url) {
  this.opts.target = url
  return this
}

Rocky.prototype.replay = function (url, opts) {
  return Route.prototype.replay.call(this, url, opts)
}

Rocky.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

Rocky.prototype.requestHandler = function (req, res, next) {
  this.router(req, res, next || function () {})
  return this
}

Rocky.prototype.middleware = function () {
  return this.requestHandler.bind(this)
}

Rocky.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

Rocky.prototype.listen = function (port, host) {
  var opts = { ssl: this.opts.ssl, port: port, host: host }
  this.server = createServer(opts, this)
  return this
}

Rocky.prototype.close = function (cb) {
  if (this.server) {
    this.server.close(cb)
  }
  return this
}

Rocky.prototype.use = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

Rocky.prototype.param =
Rocky.prototype.useParam = function (param, middleware) {
  this.router.param.apply(this.router, arguments)
  return this
}

// Mixin inherited implemented by Route
Rocky.prototype.useFor = Route.prototype.useFor
Rocky.prototype.useForward = Route.prototype.useForward
Rocky.prototype.useReplay = Route.prototype.useReplay

Rocky.prototype.route = function (method, path) {
  var route = new Route(path)
  var handler = routeHandler(this, route)
  var middleware = [].slice.call(arguments, 1)
  var args = middleware.concat([ handler ])
  this.router[method.toLowerCase()].apply(this.router, args)
  return route
}

;['get', 'post', 'delete', 'patch', 'put', 'head', 'all'].forEach(function (method) {
  Rocky.prototype[method] = function (path) {
    const args = [ method ].concat([].slice.call(arguments))
    return this.route.apply(this, args)
  }
})

function setupMiddleware(rocky) {
  rocky.router.use(function (req, res, next) {
    req.headers['x-powered-by'] = 'rocky HTTP proxy'

    req.rocky = {
      options: assign({}, rocky.opts),
      proxy: rocky
    }

    next()
  })
}
