const router       = require('router')
const Route        = require('./route')
const Base         = require('./base')
const MwPool       = require('./mwpool')
const routeHandler = require('./handler')
const createServer = require('./http/server')
const assign       = require('lodash').assign
const toArray      = require('./helpers').toArray

module.exports = Rocky

function Rocky(opts) {
  opts = opts || { xfwd: true }
  this.server = null
  this.router = router(opts.router)
  Base.call(this, opts)
  setupMiddleware(this)
}

Rocky.prototype = Object.create(Base.prototype)

Rocky.prototype.use = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

Rocky.prototype.param =
Rocky.prototype.useParam = function (param, middleware) {
  this.router.param.apply(this.router, arguments)
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
  this.server = createServer(opts, this)
  return this
}

Rocky.prototype.close = function (done) {
  if (this.server) {
    this.server.close(function (err) {
      this.server = null
      done(err)
    }.bind(this))
  }
  return this
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
  rocky.router.use(function (req, res, next) {
    var opts = assign({}, rocky.opts)

    // Expose rocky and options in the middleware
    req.rocky = {
      proxy: rocky,
      options: opts
    }

    // You worth to know who powers the server, this is OSS dude!
    req.headers['x-powered-by'] = 'rocky HTTP proxy'

    next()
  })
}
