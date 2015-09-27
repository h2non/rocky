const _           = require('lodash')
const errors      = require('../../error')
const passthrough = require('./passthrough')

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

Dispatcher.prototype.dispatch = function (req, res, next) {
  if (this.route.unregistered) return next('route')

  var route = this.route
  var opts = this.options()

  // Expose rocky params to the middleware
  req.rocky.options = opts
  req.rocky.route = route

  // Dispatch the route middleware
  route.mw.run('global', req, res, dispatcher.bind(this))

  function dispatcher(err) {
    if (err) return done(err)

    // Choose the proper request dispatch strategy
    this.doDispatch(req, res, done)
  }

  function done(err) {
    if (err === 'route') return next(err)
    if (err) return error(err)
  }

  function error(err) {
    route.emit('route:error', err, req, res)
    return errors.reply(err, res)
  }
}

Dispatcher.prototype.doDispatch = function (req, res, next) {
  var opts = req.rocky.options || this.options()
  if (opts.replayAfterForward) {
    this.dispatchSequentially(opts, req, res, next)
  } else {
    this.dispatchConcurrently(opts, req, res, next)
  }
}

Dispatcher.prototype.dispatchConcurrently = function (opts, req, res, next) {
  var args = [ this.route, opts, req, res ]
  passthrough.concurrently(args, next)
}

Dispatcher.prototype.dispatchSequentially = function (opts, req, res, next) {
  var args = [ this.route, opts, req, res ]
  passthrough.sequentially(args, next)
}
