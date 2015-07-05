const _        = require('lodash')
const replay   = require('./replay')
const parseUrl = require('url').parse

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
  req.rocky.route = this.route
  req.rocky.proxy = this.rocky

  // Dispatch the route middleware
  this.route.mw.run(req, res, function forwarder(err) {
    if (err) {
      return middlewareError(err, req, res)
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
  }.bind(this))
}

Dispatcher.prototype.forward = function (req, res) {
  var route = this.route

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

Dispatcher.prototype.replay = function (req, opts) {
  var replays = this.route.replays.length
    ? this.route.replays
    : this.rocky.replays

  replays
  .map(function (replay) {
    return _.assign({}, opts, replay)
  })
  .forEach(replay(req, route))
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

  replays
  .map(function (replay) {
    return _.assign({}, opts, replay)
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

function middlewareError(err, route, req, res) {
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
