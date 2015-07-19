const _        = require('lodash')
const replay   = require('./replay')
const errors   = require('./errors')
const forward  = require('./forward')
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
  req.rocky.options = opts
  req.rocky.route = route

  // Dispatch the route middleware
  route.mw.run('global', req, res, dispatcher.bind(this))

  function dispatcher(err) {
    if (err) {
      route.emit('route:error', err, req, res)
      return errors.replyWithError(err, res)
    }

    // Choose the proper request dispatch strategy
    if (opts.replayAfterForward) {
      this.dispatchSequentially(opts, req, res)
    } else {
      this.dispatchConcurrently(opts, req, res)
    }
  }
}

Dispatcher.prototype.dispatchConcurrently = function (opts, req, res) {
  this.forward(opts, req, res)
  this.replay(opts, req)
}

Dispatcher.prototype.dispatchSequentially = function (opts, req, res) {
  this.forward(opts, req, res, replay.bind(this))

  function replay(err, res) {
    if (!err && res && res.statusCode < 500) {
      this.replay(opts, req)
    }
  }
}

Dispatcher.prototype.forward = function (opts, req, res, next) {
  forward(this.route, opts, req, res, next)
}

Dispatcher.prototype.replay = function (opts, req) {
  replay(this.route, req, opts)
}
