var http        = require('http')
var https       = require('https')
var HttpProxy   = require('http-proxy')
var midware     = require('midware')
var parseUrl    = require('url').parse
var replay      = require('./replay')
var middleware = require('./middleware')
var assign      = require('lodash').assign

module.exports = Route

function Route(path) {
  this.opts    = {}
  this.replays = []
  this.path    = path
  this.mw      = midware()
  this.proxy   = new HttpProxy()
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
  this.mw(middleware.host(host))
  return this
}

Route.prototype.transformResponseBody = function (transformer) {
  this.mw(middleware.responseBody(transformer))
  return this
}

Route.prototype.transformRequestBody = function (transformer) {
  this.mw(middleware.requestBody(transformer))
  return this
}

Route.prototype.toPath = function (path, params) {
  this.mw(middleware.toPath(path, params))
  return this
}

Route.prototype.headers = function (headers) {
  this.mw(middleware.headers(headers))
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

    // Forward the request
    if (opts.target || opts.balance) {
      forwardRequest(req, res, route, opts)
    } else {
      // Reply with an error if target server was not defined
      missingTargetError(route, req, res)
    }

    // Then replay it, if necessary
    replayRequest(req, route, opts)
  }
}

function forwardRequest(req, res, route, opts) {
  // Balance the request, if required
  var balance = opts.balance
  if (balance && balance.length) {
    opts.target = permute(opts.balance)
  }

  if (!opts.target) { return }

  if (opts.forwardHost) {
    req.headers.host = parseUrl(opts.target).host
  }

  // Forward the request to the main target
  route.proxy.web(req, res, opts, handler)

  function handler(err) {
    route.proxy.emit('proxy:error', err, req, res)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: err.message || err }))
    }
  }
}

function replayRequest(req, route, opts) {
  var replays = route.replays.length
    ? route.replays
    : opts.replays

  replays.map(function (replay) {
    return assign({}, opts, replay)
  })
  .forEach(replay(req, route))
}

function missingTargetError(route, req, res) {
  var error = new Error('Target URL was not defined for this route')
  route.proxy.emit('route:error', error, req, res)

  if (!res.headersSent) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: error.message }))
  }
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
