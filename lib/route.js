const midware     = require('midware')
const HttpProxy   = require('http-proxy')
const middleware  = require('./middleware')
const assign      = require('lodash').assign

module.exports = Route

function Route(path) {
  this.opts    = {}
  this.replays = []
  this.path    = path
  this.mw      = midware()
  this.proxy   = new HttpProxy()
}

Route.prototype.target  =
Route.prototype.forward = function (url) {
  this.opts.target = url
  return this
}

Route.prototype.balance = function (urls) {
  if (Array.isArray(urls)) {
    this.opts.balance = urls
  }
  return this
}

Route.prototype.options = function (opts) {
  assign(this.opts, opts)
  return this
}

Route.prototype.replay = function (url, opts) {
  if (typeof url === 'string') {
    url = { target: url }
  }
  this.replays.push(assign({}, url, opts))
  return this
}

Route.prototype.use = function () {
  this.mw.apply(null, arguments)
  return this
}

Route.prototype.on = function () {
  this.proxy.on.apply(this.proxy, arguments)
  return this
}

Route.prototype.once = function () {
  this.proxy.once.apply(this.proxy, arguments)
  return this
}

Route.prototype.off = function () {
  this.proxy.off.apply(this.proxy, arguments)
  return this
}

Route.prototype.transformResponseBody = function (transformer) {
  this.mw(middleware.responseBody(transformer))
  return this
}

Route.prototype.transformRequestBody = function (transformer) {
  this.mw(middleware.requestBody(transformer))
  return this
}

Route.prototype.host = function (host) {
  this.mw(middleware.host(host))
  return this
}

Route.prototype.toPath = function (path, params) {
  this.mw(middleware.toPath(path, params))
  return this
}

Route.prototype.headers = function (headers) {
  this.mw(middleware.headers(headers))
  return this
}

Route.prototype.reply = function (code, headers, body) {
  this.mw(middleware.reply.apply(null, arguments))
  return this
}
