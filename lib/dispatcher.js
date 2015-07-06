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
  req.rocky.route = route

  // Dispatch the route middleware
  route.mw.run('forward', req, res, dispatcher.bind(this))

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

  // Finally forward the request
  route.proxy.web(req, res, opts, handler)

  function handler(err) {
    route.proxy.emit('proxy:error', err, req, res)

    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: err.message || err }))
    }
  }
}

Dispatcher.prototype.replay = function (opts, req) {
  var replays = this.route.replays.length
    ? this.route.replays
    : this.rocky.replays

  // Clone the original request to avoid side-effects
  var replayReq = _.clone(req)
  replayReq.headers = _.clone(req.headers)
  replayReq.rocky = _.clone(req.rocky)

  // Dispatch the replay global middleware
  this.rocky.mw.run('replay', replayReq, null, replayer.bind(this))

  function replayer(err) {
    replays.map(function (replay) {
      return _.assign({}, opts, replay)
    })
    .forEach(replay(replayReq, this.route))
  }
}

function missingTargetError(route, req, res) {
  var error = new Error('Cannot forward the request. No target URL was defined for this route')
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
