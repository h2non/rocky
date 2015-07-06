const midware     = require('midware')
const HttpProxy   = require('http-proxy')
const middleware  = require('./middleware')
const MwPool      = require('./mwpool')
const assign      = require('lodash').assign

module.exports = Route

function Route(path) {
  this.opts    = {}
  this.replays = []
  this.path    = path
  this.mw      = new MwPool()
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

Route.prototype.useFor = function () {
  return this.mw.use.apply(this.mw, arguments)
}

Route.prototype.use = function () {
  this.useFor('global', arguments)
  return this
}

Route.prototype.useForward = function () {
  this.useFor('forward', arguments)
  return this
}

Route.prototype.useReplay = function () {
  this.useFor('replay', arguments)
  return this
}

Route.prototype.on = function (event, listener) {
  this.proxy.on(event, listener)
  return this
}

Route.prototype.once = function (event, listener) {
  this.proxy.on(event, listener)
  return this
}

Route.prototype.off = function (event, listener) {
  this.proxy.off(event, listener)
  return this
}

Route.prototype.transformResponseBody = function (transformer, filter) {
  this.use(middleware.responseBody(transformer, filter))
  return this
}

Route.prototype.transformRequestBody = function (transformer, filter) {
  this.use(middleware.requestBody(transformer, filter))
  return this
}

Route.prototype.host = function (host) {
  this.use(middleware.host(host))
  return this
}

Route.prototype.toPath = function (path, params) {
  this.use(middleware.toPath(path, params))
  return this
}

Route.prototype.headers = function (headers) {
  this.use(middleware.headers(headers))
  return this
}

Route.prototype.reply = function (code, headers, body) {
  this.use(middleware.reply.apply(null, arguments))
  return this
}
