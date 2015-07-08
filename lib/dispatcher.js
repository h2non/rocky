const _            = require('lodash')
const replay       = require('./replay')
const parseUrl     = require('url').parse

module.exports = Dispatcher

function Dispatcher(rocky, route) {
  this.rocky = rocky
  this.route = route
}

Dispatcher.prototype.options = function () {
  var rockyOpts = _.clone(this.rocky.opts)
  rockyOpts.replays = this.rocky.replays

  var routeOpts = _.clone(this.route.opts)
  return _.assign(rockyOpts, routeOpts)
}

Dispatcher.prototype.dispatch = function (req, res) {
  var route = this.route
  var opts = this.options()

  // Expose rocky params to the middleware
  if (!req.rocky) req.rocky = {}
  req.rocky.options = opts
  req.rocky.route = route

  // Dispatch the route middleware
  route.mw.run('global', req, res, dispatcher.bind(this))

  function dispatcher(err) {
    if (err) {
      return middlewareError(err, req, res)
    }
    // Forward the request
    this.forward(opts, req, res)

    // Then replay it, if necessary
    this.replay(opts, req)
  }
}

Dispatcher.prototype.forward = function (opts, req, res) {
  var route = this.route

  // Balance the request, if configured
  var balance = opts.balance
  if (balance && balance.length) {
    opts.target = permute(balance)
  }

  // Reply with an error if target server was not defined
  if (!opts.target) {
    return missingTargetError(route, req, res)
  }

  // Run the forward middleware
  route.mw.run('forward', req, res, forwarder)

  function forwarder(err) {
    if (err) {
      return middlewareError(err, req, res)
    }
    // Finally forward the request
    route.proxy.web(req, res, opts, handler)
  }

  function handler(err) {
    route.proxy.emit('proxy:error', err, req, res)

    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: err.message || err }))
    }
  }
}

Dispatcher.prototype.replay = function (opts, req) {
  replay(this.route, req, opts)
}

function missingTargetError(route, req, res) {
  var error = new Error('Cannot forward the request. Missing target URL for this route')
  route.proxy.emit('route:error', error, req, res)

  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: error.message }))
  }
}

function middlewareError(route, req, res) {
  route.proxy.emit('route:error', err, req, res)

  if (!res.headersSent) {
    res.writeHead(+err.code || 502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message || err }))
  }
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
