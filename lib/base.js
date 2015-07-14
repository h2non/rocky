const MwPool = require('./mwpool')
const assign = require('lodash').assign

module.exports = Base

function Base(opts) {
  this.replays = []
  this.opts    = opts || {}
  this.mw      = new MwPool
}

Base.prototype.target    =
Base.prototype.forward   =
Base.prototype.forwardTo = function (url, opts) {
  this.opts.target = url
  assign(this.opts, opts)
  return this
}

Base.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

Base.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

Base.prototype.replay   =
Base.prototype.replayTo = function (url, opts) {
  if (typeof url === 'string') {
    url = { target: url }
  }
  this.replays.push(assign({}, url, opts))
  return this
}

Base.prototype.useFor = function () {
  return this.mw.use.apply(this.mw, arguments)
}

Base.prototype.use = function () {
  this.useFor('global', arguments)
  return this
}

Base.prototype.useForward = function () {
  this.useFor('forward', arguments)
  return this
}

Base.prototype.useReplay = function () {
  this.useFor('replay', arguments)
  return this
}
