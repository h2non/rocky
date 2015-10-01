const proxy  = require('./proxy')
const passes = require('./passes')
const clone  = require('lodash').clone
const helpers = require('../../helpers')

module.exports = Dispatcher

function Dispatcher(rocky) {
  this.rocky = rocky
}

Dispatcher.prototype.dispatch = function (req, socket, head, done) {
  var rocky = this.rocky
  var opts = clone(this.rocky.opts)

  // Dispatch WebSocket middleware
  rocky.mw.run('ws', req, socket, head, dispatcher.bind(this))

  function dispatcher(err) {
    if (err) return done(err)
    this.doDispatch(req, socket, head, done)
  }
}

Dispatcher.prototype.doDispatch = function (req, socket, head, done) {
  var opts = clone(this.rocky.opts)
  this.dispatchConcurrently(opts, req, socket, head, done)
}

Dispatcher.prototype.dispatchConcurrently = function (opts, req, socket, head, done) {
  helpers.eachConcurrently(passes, function (pass, next) {
    pass(opts, req, socket, head, next)
  }, done)
}
