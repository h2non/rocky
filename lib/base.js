const MwPool     = require('midware-pool')
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
  if (Array.isArray(url)) {
    return this.balance(url)
  }

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
  url = typeof url === 'string'
    ? { target: url }
    : url

  var replay = assign({}, url, opts)
  this.replays.push(replay)
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

Base.prototype.stopReplay = function () {
  this.replays.splice(0)
  return this
}

Base.prototype.headers = function (headers) {
  this.use(middleware.headers(headers))
  return this
}

Base.prototype.query = function (query) {
  this.use(middleware.query(query))
  return this
}

Base.prototype.timeout = function (ms) {
  this.opts.timeout = ms
  return this
}

Base.prototype.bufferBody =
Base.prototype.interceptBody = function (filter) {
  function pass(req, res, next) { next() }
  this.use(middleware.requestBody(pass, filter))
  return this
}

Base.prototype.useFor = function () {
  this.mw.use.apply(this.mw, arguments)
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

Base.prototype.useOutgoing =
Base.prototype.useResponse = function () {
  var stack = this.mw.stack('response')

  if (!stack || stack.length < 2) {
    this.use(middleware.responseBody(dispatch.bind(this)))
  }

  function dispatch(req, res, next) {
    if (res._alreadyIntercepted) return next()
    res._alreadyIntercepted = true
    this.mw.run('response', req, res, next)
  }

  this.useFor('response', arguments)
  return this
}
