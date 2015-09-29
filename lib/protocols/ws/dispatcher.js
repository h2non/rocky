const _      = require('lodash')
const errors = require('../../error')
const proxy  = require('./proxy')

module.exports = Dispatcher

function Dispatcher(rocky) {
  this.rocky = rocky
}

Dispatcher.prototype.dispatch = function (req, socket, head, next) {
  var rocky = this.rocky
  var opts = _.clone(this.rocky.opts)

  // Dispatch the route middleware
  rocky.mw.run('ws', req, socket, head, dispatcher.bind(this))

  function dispatcher(err) {
    if (err) return error(err)
    this.doDispatch(req, socket, head, next)
  }

  function error(err) {
    rocky.emit('ws:error', err, req, socket)
    next(err)
  }
}

Dispatcher.prototype.doDispatch = function (req, socket, head, next) {
  var opts = this.rocky.opts
  var replays = this.rocky.replays

  // Pause the data flow
  req.pause()

  // to do: support balance
  if (opts.target) {
    proxy(opts, req, socket, head, next)
  }

  if (replays.length) {
    replays.forEach(function (replay) {
      proxy(opts, req, socket, head, function () {})
    })
  }

  req.resume()
}
