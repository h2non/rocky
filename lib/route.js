var _           = require('lodash')
var http        = require('http')
var HttpProxy   = require('http-proxy')
var midware     = require('midware')
var parseUrl    = require('url').parse
var middlewares = require('./middlewares')
var debug       = require('debug')('rocky:route')

module.exports = Route

function Route(path) {
  this.opts      = {}
  this.replays   = []
  this.path      = path
  this.mw        = midware()
  this.proxy     = new HttpProxy()
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
  _.assign(this.opts, opts)
  return this
}

Route.prototype.replay = function (url) {
  this.replays.push.apply(this.replays, arguments)
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
  var opts = _.assign({}, options, this.opts)

  // Dispatch route middleware
  this.mw.run(req, res, forward)

  function forward(err) {
    if (err) { return }

    // Balance, if required
    var balance = opts.balance
    if (balance) {
      opts.target = balance.shift()
      balance.push(opts.target)
    }

    // Forward the request to the main target
    if (opts.target) {
      if (opts.forwardHost) {
        req.headers.host = parseUrl(opts.target).host
      }

      debug('FORWARD [%s] %s => %s', req.method, req.url, opts.target)
      route.proxy.web(req, res, opts)
    }

    // Replay the request, if necessary
    var replays = route.replays.length
      ? route.replays
      : opts.replays

    replays.forEach(replay)
  }

  function replay(url) {
    var proxy = new HttpProxy()
    var res = new http.ServerResponse(req)
    var options = _.assign(opts, { target: url })

    debug('REPLAY  [%s] %s => %s', req.method, req.url, url)

    proxy.once('proxyReq', function (proxyReq, req, res, opts) {
      route.proxy.emit('replay:proxyReq', proxyReq, req, res, opts)
    })
    proxy.once('proxyRes', function (proxyRes, req, res) {
      route.proxy.emit('replay:proxyRes', proxyRes, req, res)
    })
    proxy.once('error', function (err, req, res) {
      route.proxy.emit('replay:error', err, req, res)
    })

    if (opts.forwardHost) {
      req.headers.host = parseUrl(url).host
    }

    proxy.web(req, res, options)
  }
}
