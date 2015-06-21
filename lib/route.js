var _       = require('lodash')
var http    = require('http')
var Emitter = require('events').EventEmitter
var debug   = require('debug')('rocky:route')

module.exports = Route

function Route(path) {
  this.path    = path
  this.target  = null
  this.replays = []
  Emitter.call(this)
}

Route.prototype = Object.create(Emitter.prototype)

Route.prototype.target  =
Route.prototype.forward = function (url) {
  this.target = url
  return this
}

Route.prototype.replay = function (url) {
  this.replays.push.apply(this.replays, arguments)
  return this
}

Route.prototype._handle = function (rocky) {
  var route = this

  return function handler(req, res) {
    var target = route.target || rocky.opts.target
    var opts = _.assign({}, rocky.opts, { target: target })
    var eventProxy = proxyHandler(route, res, res)

    route.emit('request', opts, req, res)

    // Forward the request to the main target
    if (target) {
      debug('FORWARD [%s] %s => %s', req.method, req.url, target)
      rocky.proxy.web(req, res, { target: target }, eventProxy('forward'))
    }

    // Replay the request if necessary
    var replays = route.replays.length
      ? route.replays
      : rocky.replays

    if (replays.length === 0) {
      return
    }

    replays.forEach(function (url) {
      var res = new http.ServerResponse(req)
      var opts = { target: url }

      debug('REPLAY  [%s] %s => %s', req.method, req.url, url)
      rocky.proxy.web(req, res, opts, eventProxy('replay'))
    })
  }
}

function proxyHandler(route, req, res) {
  return function (type) {
    return function (err) {
      route.emit('error:' + type, err, req, res)
    }
  }
}
