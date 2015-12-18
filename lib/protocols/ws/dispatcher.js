const passes = require('./passes')
const clone = require('lodash').clone

module.exports = Dispatcher

function Dispatcher (rocky) {
  this.rocky = rocky
}

Dispatcher.prototype.dispatch = function (req, socket, head, done) {
  const rocky = this.rocky

  // Dispatch WebSocket middleware
  rocky.mw.run('ws', req, socket, head, function dispatcher (err) {
    if (err) return done(err)
    this.doDispatch(req, socket, head, done)
  }.bind(this))
}

Dispatcher.prototype.doDispatch = function (req, socket, head, done) {
  const opts = clone(this.rocky.opts)
  this.dispatchConcurrently(opts, req, socket, head, done)
}

Dispatcher.prototype.dispatchConcurrently = function (opts, req, socket, head, done) {
  passes.concurrently(opts, req, socket, head, done)
}
