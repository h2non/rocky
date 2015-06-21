var parseUrl = require('url').parse
var router = require('router')
var http = require('http')
var https = require('https')
var httpProxy = require('http-proxy')
var Route = require('./route')

module.exports = Rocky

function Rocky(opts) {
  opts = opts || {}
  this.opts    = opts
  this.replays = []
  this.router  = router(opts.router)
  this.proxy   = httpProxy.createProxyServer(opts)
}

Rocky.prototype.target  =
Rocky.prototype.forward = function (url) {
  this.opts.target = parseUrl(url)
  return this
}

Rocky.prototype.replay = function (url) {
  this.replays.push.apply(this.replays, arguments)
  return this
}

Rocky.prototype.use = function () {
  this.router.use.apply(this.router, arguments)
  return this
}

Rocky.prototype.on = function (event, fn) {
  this.proxy.on(event, fn)
  return this
}

Rocky.prototype.route = function (path, method) {
  var route = new Route(path)
  var handler = route._handle(this)
  this.router[method || 'all'](path, handler)
  return route
}

Rocky.prototype.requestHandler = function (req, res, next) {
  this.router(req, res, next || function () {})
  return this
}

Rocky.prototype.middleware = function () {
  return this.requestHandler.bind(this)
}

Rocky.prototype.listen = function (port, host) {
  var handler = serverHandler.bind(this)

  this.server = this.opts.ssl ?
    https.createServer(this.opts.ssl, handler) :
    http.createServer(handler)

  this.server.listen(port, host)

  return this
}

function serverHandler(req, res) {
  this.requestHandler(req, res, function (err) {
    if (err) {
      res.writeHead(500)
      res.write(JSON.stringify({ error: 'Server error: ' + err }))
      res.end()
      return
    }

    res.writeHead(404)
    res.write(JSON.stringify({ error: 'No route configured' }))
    res.end()
  })
}

;['get', 'post', 'delete', 'patch', 'put', 'options', 'all'].forEach(function (method) {
  Rocky.prototype[method] = function (path) {
    return this.route(path, method)
  }
})
