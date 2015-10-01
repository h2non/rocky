const router       = require('router')
const Route        = require('./route')
const Base         = require('./base')
const MwPool       = require('./mwpool')
const server       = require('./server')
const assign       = require('lodash').assign
const toArray      = require('./helpers').toArray
const routeHandler = require('./protocols/http/route-handler')

module.exports = Rocky

function Rocky(opts) {
  opts = opts || {}
  this.server = null
  this.router = router(opts.router)
  Base.call(this, opts)
  setupMiddleware(this)
}

Rocky.prototype = Object.create(Base.prototype)

Rocky.prototype.protocol = function (name) {
  if (name === 'ws') this.opts.ws = true
  return this
}

Rocky.prototype.use =
Rocky.prototype.useIncoming = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

Rocky.prototype.param =
Rocky.prototype.useParam = function (param, middleware) {
  this.router.param.apply(this.router, arguments)
  return this
}

Rocky.prototype.useWs = function (middleware) {
  this.useFor('ws', arguments)
  return this
}

Rocky.prototype.middleware = function () {
  return this.requestHandler.bind(this)
}

Rocky.prototype.requestHandler = function (req, res, next) {
  this.router(req, res, next || function () {})
  return this
}

Rocky.prototype.listen = function (port, host) {
  var opts = this.opts
  if (port) opts.port = port
  if (host) opts.host = host
  if (opts.ws) this.routeAll()
  this.server = server(this)
  return this
}

Rocky.prototype.close = function (done) {
  if (this.server) {
    this.server.close(function (err) {
      this.server = null
      if (done) done(err)
    }.bind(this))
  }
  return this
}

Rocky.prototype.routeAll = function () {
  return this.all('/*')
}

Rocky.prototype.route = function (method, path) {
  var route = new Route(path)
  route.proxy = this

  var handler = routeHandler(this, route)
  var middleware = [].slice.call(arguments, 1)
  var args = middleware.concat([ handler ])

  this.router[method.toLowerCase()].apply(this.router, args)
  return route
}

;['get', 'post', 'delete', 'patch', 'put', 'head', 'trace', 'all'].forEach(function (method) {
  Rocky.prototype[method] = function (path) {
    const args = [ method ].concat(toArray(arguments))
    return this.route.apply(this, args)
  }
})

function setupMiddleware(rocky) {
  // Setup HTTP middleware
  rocky.router.use(function (req, res, next) {
    exposeRocky(rocky, req)
    next()
  })

  // Setup WebSocket middleware
  rocky.mw.use('ws', function (req, socket, head, next) {
    exposeRocky(rocky, req)
    next()
  })
}

function exposeRocky(rocky, req) {
  var opts = assign({}, rocky.opts)
  req.rocky = { proxy: rocky, options: opts }
}
