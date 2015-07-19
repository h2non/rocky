const midware     = require('midware')
const Base        = require('./base')
const middleware  = require('./middleware')
const MwPool      = require('./mwpool')
const assign      = require('lodash').assign

module.exports = Route

function Route(path) {
  Base.call(this)
  this.path = path
}

Route.prototype = Object.create(Base.prototype)

Route.prototype.host = function (host) {
  this.use(middleware.host(host))
  return this
}

Route.prototype.toPath = function (path, params) {
  this.use(middleware.toPath(path, params))
  return this
}

Route.prototype.reply = function (code, headers, body) {
  this.use(middleware.reply(code, headers, body))
  return this
}

Route.prototype.redirect = function (url) {
  this.use(middleware.redirect(url))
  return this
}

Route.prototype.transformResponse     =
Route.prototype.transformResponseBody = function (transformer, filter) {
  this.use(middleware.responseBody(transformer, filter))
  return this
}

Route.prototype.transformRequest     =
Route.prototype.transformRequestBody = function (transformer, filter) {
  this.use(middleware.requestBody(transformer, filter))
  return this
}
