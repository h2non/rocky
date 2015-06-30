var http        = require('http')
var https       = require('https')
var HttpProxy   = require('http-proxy')
var midware     = require('midware')
var parseUrl    = require('url').parse
var replay      = require('./replay')
var middlewares = require('./middlewares')
var assign      = require('lodash').assign

module.exports = Route

function Route(path) {
  this.opts     = {}
  this.replays  = []
  this.path     = path
  this.mw       = midware()
  this.proxy    = new HttpProxy()
}

Route.prototype.target  =
Route.prototype.forward = function (url) {
  this.opts.target = url
  return this
}

Route.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

Route.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

Route.prototype.replay = function (url, opts) {
  if (typeof url === 'string') {
    url = { target: url }
  }
  this.replays.push(assign({}, url, opts))
  return this
}

Route.prototype.use = function () {
  this.mw.apply(null, arguments)
  return this
}

Route.prototype.on = function () {
  this.proxy.on.apply(this.proxy, arguments)
  return this
}

Route.prototype.once = function () {
  this.proxy.once.apply(this.proxy, arguments)
  return this
}

Route.prototype.off = function () {
  this.proxy.off.apply(this.proxy, arguments)
  return this
}

Route.prototype.host = function (host) {
  this.mw(middlewares.host(host))
  return this
}

Route.prototype.transformResponseBody = function (transformer) {
  this.mw(middlewares.transformResponseBody(transformer))
  return this
}

Route.prototype.transformRequestBody = function (transformer) {
  this.mw(middlewares.transformRequestBody(transformer))
  return this
}

Route.prototype.toPath = function (path, params) {
  this.mw(middlewares.toPath(path, params))
  return this
}

Route.prototype.headers = function (headers) {
  this.mw(middlewares.headers(headers))
  return this
}

Route.prototype.handle = function (options, req, res) {
  var route = this
  var opts = assign({}, options, this.opts)

  // Dispatch the route middleware
  this.mw.run(req, res, forwarder)

  function forwarder(err) {
    if (err) {
      return route.proxy.emit('route:error', err, req, res)
    }

    // Ensure that we can forward/replay the request
    if (!opts.target && !opts.balance && !route.replays.length) {
      return cannotForwardError(route, req, res)
    }

    // Forward the request
    proxyRequest(req, res, route, opts)

    // And replay it, if necessary
    replayRequest(req, route, opts)
  }
}

function proxyRequest(req, res, route, opts) {
  // Balance the request, if required
  var balance = opts.balance
  if (balance) {
    opts.target = balance.shift()
    balance.push(opts.target)
  }

  if (!opts.target) { return }

  if (opts.forwardHost) {
    req.headers.host = parseUrl(opts.target).host
  }

  // Forward the request to the main target
  route.proxy.web(req, res, opts)
}

function replayRequest(req, route, opts) {
  var replays = route.replays.length
    ? route.replays
    : opts.replays

  replays
    .map(function (replay) {
      return assign({}, opts, replay)
    })
    .forEach(replay(req, route))
}

function cannotForwardError(route, req, res) {
  var error = { 'message': 'Target URL was not defined for this route' }
  route.proxy.emit('route:error', null, req, res)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  return res.end(JSON.stringify(error))
}
