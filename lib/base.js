const MwPool     = require('./mwpool')
const assign     = require('lodash').assign
const middleware = require('./middleware')
const Emitter    = require('events').EventEmitter

module.exports = Base

function Base(opts) {
  Emitter.call(this)
  this.replays = []
  this.opts    = opts || {}
  this.mw      = new MwPool
}

Base.prototype = Object.create(Emitter.prototype)

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

Base.prototype.sequential =
Base.prototype.replayAfterForward = function (filter) {
  this.bufferBody(filter)
  this.opts.replayAfterForward = true
  return this
}

Base.prototype.replaySequentially = function (filter) {
  this.bufferBody(filter)
  this.opts.replaySequentially = true
  return this
}

Base.prototype.retry = function (opts, filter) {
  this.bufferBody(filter)
  this.opts.retry = opts
  return this
}

Base.prototype.replayRetry = function (opts, filter) {
  this.bufferBody(filter)
  this.opts.replayRetry = opts
  return this
}

Base.prototype.useFor = function () {
  this.mw.use.apply(this.mw, arguments)
  return this
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

Base.prototype.bufferBody =
Base.prototype.interceptBody = function (filter) {
  this.use(middleware.requestBody(function (res, res, next) {
    next()
  }, filter))
  return this
}

Base.prototype.headers = function (headers) {
  this.use(middleware.headers(headers))
  return this
}

Base.prototype.timeout = function (ms) {
  this.opts.timeout = ms
  return this
}
