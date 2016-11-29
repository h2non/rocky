const MwPool = require('midware-pool')
const assign = require('lodash').assign
const middleware = require('./middleware')
const Emitter = require('events').EventEmitter

module.exports = Base

/**
 * Base generic interface implementing HTTP shared logic and features
 * inherited across different HTTP abstract entities.
 *
 * @param {Object} opts
 * @class Base
 * @extend EventEmitter
 * @constructor
 */

function Base (opts) {
  Emitter.call(this)
  this.replays = []
  this.opts = opts || {}
  this.mw = new MwPool()
}

Base.prototype = Object.create(Emitter.prototype)

/**
 * Target URI to foward the incoming traffic.
 *
 * @param {String} url
 * @param {Object} opts
 * @return {Base}
 * @method target
 * @alias forward
 * @alias forwardTo
 */

Base.prototype.target =
Base.prototype.forward =
Base.prototype.forwardTo = function (url, opts) {
  if (Array.isArray(url)) {
    return this.balance(url)
  }

  this.opts.target = url
  assign(this.opts, opts)
  return this
}

/**
 * Defines multiple URLs to balance the icnoming traffic.
 *
 * @param {Array} urls
 * @return {Base}
 * @method balance
 */

Base.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

/**
 * Defines a target replay server URL.
 * You can optionally pass a replay only custom options.
 *
 * Call this method multiple times to replay
 * traffic to multiple targets.
 *
 * @param {String} url
 * @param {Object} opts
 * @return {Base}
 * @method replay
 * @alias replayTo
 */

Base.prototype.replay =
Base.prototype.replayTo = function (url, opts) {
  url = typeof url === 'string'
    ? { target: url }
    : url

  const replay = assign({}, url, opts)
  this.replays.push(replay)

  return this
}

/**
 * Defines custom options, optionally overriden the existent ones.
 *
 * @param {Object} opts
 * @return {Base}
 * @method options
 */

Base.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

/**
 * Enable first forward, and then if all success, replay operation mode, optionally passing
 * a middleware-like function to determine if the forward mode
 * should be applied or not to the current HTTP request.
 *
 * @param {Function} filter
 * @return {Base}
 * @method sequential
 * @alias replayAfterForward
 */

Base.prototype.sequential =
Base.prototype.replayAfterForward = function (filter) {
  this.bufferBody(filter)
  this.opts.replayAfterForward = true
  return this
}

/**
 * Enable sequential replay mode. In case that one replay server fails
 * the subsequent pending replay request will be canceled.
 *
 * @param {Function} filter
 * @return {Base}
 * @method replaySequentially
 */

Base.prototype.replaySequentially = function (filter) {
  this.bufferBody(filter)
  this.opts.replaySequentially = true
  return this
}

/**
 * Enable retry/backoff logic for HTTP traffic.
 * The resilient algorithm will retry with a simple exponential backoff
 * logic multiple times (configurable), until the server
 * replies with a proper status.
 *
 * Enabling this implies that all the request payload data will be buffered in heap memory.
 * Don't use it when dealing with large payloads.
 *
 * @param {Object} opts
 * @param {Function} filter
 * @return {Base}
 * @method retry
 */

Base.prototype.retry = function (opts, filter) {
  this.bufferBody(filter)
  this.opts.retry = opts
  return this
}

/**
 * Shortcut method to stop replaying HTTP traffic.
 *
 * @return {Base}
 * @method stopReplay
 */

Base.prototype.stopReplay = function () {
  this.replays.splice(0)
  return this
}

/**
 * Adds custom HTTP headers.
 *
 * @param {Object} headers
 * @return {Base}
 * @method headers
 */

Base.prototype.headers = function (headers) {
  this.use(middleware.headers(headers))
  return this
}

/**
 * Adds query params.
 *
 * @param {Object} query
 * @return {Base}
 * @method query
 */

Base.prototype.query = function (query) {
  this.use(middleware.query(query))
  return this
}

/**
 * Specifies a custom request timeout in miliseconds. Defaults to `30000`.
 *
 * @param {Number} ms
 * @return {Base}
 * @method timeout
 */

Base.prototype.timeout = function (ms) {
  this.opts.timeout = ms
  return this
}

/**
 * Waits and buffer all the request payload data buffer in heap before forwaring/replaing it.
 * Useful for intercepting and modifying payloads.
 *
 * @param {Function} filter
 * @return {Base}
 * @method bufferBody
 * @alias inteceptBody
 */

Base.prototype.bufferBody =
Base.prototype.interceptBody = function (filter) {
  function pass (req, res, next) { next() }
  this.use(middleware.requestBody(pass, filter))
  return this
}

/**
 * Attaches a custom middleware function to the given phase.
 *
 * @param {String} phase
 * @param {Function} middleware
 * @return {Base}
 * @method useFor
 */

Base.prototype.useFor = function () {
  this.mw.use.apply(this.mw, arguments)
  return this
}

/**
 * Attaches a custom middleware function to the forward incoming phase.
 *
 * @param {Function} middleware
 * @return {Base}
 * @method useForward
 */

Base.prototype.useForward = function () {
  this.useFor('forward', arguments)
  return this
}

/**
 * Attaches a custom middleware function to the replay incoming phase.
 *
 * @param {Function} middleware
 * @return {Base}
 * @method useReplay
 */

Base.prototype.useReplay = function () {
  this.useFor('replay', arguments)
  return this
}

/**
 * Attaches a custom middleware function to the outgoing phase.
 *
 * @param {Function} middleware
 * @return {Base}
 * @method useResponse
 * @alias useOutgoing
 */

Base.prototype.useOutgoing =
Base.prototype.useResponse = function () {
  const stack = this.mw.stack('response')

  if (!stack || stack.length < 2) {
    this.use(middleware.responseBody(function dispatch (req, res, next) {
      // If body was already intercepted, just continue with it
      if (res._alreadyIntercepted) return next()
      // Flag the response as intercepted
      res._alreadyIntercepted = true
      // Run the response middleware
      this.mw.run('response', req, res, next)
    }.bind(this)))
  }

  this.useFor('response', arguments)
  return this
}
