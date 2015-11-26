const _ = require('lodash')
const passes = require('./passes')
const errors = require('../../error')

module.exports = Dispatcher

function Dispatcher (rocky, route) {
  this.rocky = rocky
  this.route = route
}

Dispatcher.prototype.options = function () {
  const rockyOpts = _.clone(this.rocky.opts)
  rockyOpts.replays = this.rocky.replays

  const routeOpts = _.clone(this.route.opts)
  return _.assign(rockyOpts, routeOpts)
}

Dispatcher.prototype.dispatch = function (req, res, next) {
  if (this.route.unregistered) return next('route')

  const route = this.route
  const opts = this.options()

  // Expose rocky params to the middleware
  req.rocky.options = opts
  req.rocky.route = route

  // Dispatch the route middleware
  route.mw.run('global', req, res, dispatcher.bind(this))

  function dispatcher (err) {
    if (err) return done(err)

    // Choose the proper request dispatch strategy
    this.doDispatch(req, res, done)
  }

  function done (err) {
    if (err === 'route') return next(err)
    if (err) return error(err)
  }

  function error (err) {
    route.emit('route:error', err, req, res)
    errors.reply(err, res)
    next(err)
  }
}

Dispatcher.prototype.doDispatch = function (req, res, next) {
  const opts = req.rocky.options || this.options()
  if (opts.replayAfterForward) {
    this.dispatchSequentially(opts, req, res, next)
  } else {
    this.dispatchConcurrently(opts, req, res, next)
  }
}

Dispatcher.prototype.dispatchConcurrently = function (opts, req, res, next) {
  const args = [ this.route, opts, req, res ]
  passes.concurrently(args, next)
}

Dispatcher.prototype.dispatchSequentially = function (opts, req, res, next) {
  const args = [ this.route, opts, req, res ]
  passes.sequentially(args, next)
}
