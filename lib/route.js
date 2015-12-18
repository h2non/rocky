const Base = require('./base')
const middleware = require('./middleware')

module.exports = Route

/**
 * Route implements an HTTP route behavior and logic
 *
 * @param {String} path
 * @class Route
 * @extend Base
 * @constructor
 */

function Route (path) {
  Base.call(this)
  this.path = path
  this.unregistered = false
}

Route.prototype = Object.create(Base.prototype)

/**
 * Defines a host header field for the current route
 *
 * @param {String} host
 * @return {Route}
 * @method host
 */

Route.prototype.host = function (host) {
  this.use(middleware.host(host))
  return this
}

/**
 * Overwrites the HTTP path for the current request, optionally
 * using a custom path params.
 *
 * @param {String} path
 * @param {Object} params
 * @return {Route}
 * @method toPath
 */

Route.prototype.toPath = function (path, params) {
  this.use(middleware.toPath(path, params))
  return this
}

/**
 * Replies an incoming request with a custom HTTP code
 * and optionally with additional headers and/or body.
 *
 * @param {Number} code
 * @param {Object} headers
 * @param {String/Buffer} body
 * @return {Route}
 * @method reply
 */

Route.prototype.reply = function (code, headers, body) {
  this.use(middleware.reply(code, headers, body))
  return this
}

/**
 * Redirects and incoming request to a target URL.
 *
 * @param {String} url
 * @return {Route}
 * @method redirect
 */

Route.prototype.redirect = function (url) {
  this.use(middleware.redirect(url))
  return this
}

/**
 * Unregister the current route, meaning it won't be used
 * by the router in future incoming traffic.
 *
 * @method unregister
 * @return {Route}
 */

Route.prototype.unregister = function () {
  this.unregistered = true
  return this
}

/**
 * Attaches a middleware function to the incoming
 * phase middleware for the current route.
 *
 * @param {Function} middleware
 * @return {Route}
 * @method use
 * @alias useIncoming
 */

Base.prototype.use =
Base.prototype.useIncoming = function () {
  this.useFor('global', arguments)
  return this
}

/**
 * Attaches a transformer function to the incoming
 * phase for the current route, optinally defining a filter
 * in order to determine if the transformer should be applied or not.
 *
 * @param {Function} transformer
 * @param {Function} filter
 * @return {Route}
 * @method transformResponse
 * @alias transformResponseBody
 */

Route.prototype.transformResponse =
Route.prototype.transformResponseBody = function (transformer, filter) {
  this.use(middleware.responseBody(transformer, filter))
  return this
}

/**
 * Attaches a transformer function to the outgoing
 * phase for the current route, optinally defining a filter
 * in order to determine if the transformer should be applied or not.
 *
 * @param {Function} transformer
 * @param {Function} filter
 * @return {Route}
 * @method transformRequest
 * @alias transformRequestBody
 */

Route.prototype.transformRequest =
Route.prototype.transformRequestBody = function (transformer, filter) {
  this.use(middleware.requestBody(transformer, filter))
  return this
}
