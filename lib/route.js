var _       = require('lodash')
var http    = require('http')
var midware = require('midware')
var Emitter = require('events').EventEmitter
var debug   = require('debug')('rocky:route')

module.exports = Route

function Route(path) {
  this.opts    = {}
  this.replays = []
  this.path    = path
  this.use     = midware()
  Emitter.call(this)
}

Route.prototype = Object.create(Emitter.prototype)

Route.prototype.target  =
Route.prototype.forward = function (url) {
  this.opts.target = url
  return this
}

Route.prototype.options = function (opts) {
  _.assign(this.opts, opts)
  return this
}

Route.prototype.replay = function (url) {
  this.replays.push.apply(this.replays, arguments)
  return this
}

Route.prototype._handle = function (req, res) {
  var route = this
  var rocky = this.rocky
  var opts = _.assign({}, rocky.opts, this.opts)
  var eventProxy = proxyHandler(route, res, res)

  // Dispatch event and middlewares
  this.emit('request', opts, req, res)
  this.use.run(req, res, next)

  function next(err) {
    if (err) { return }

    // Forward the request to the main target
    if (opts.target) {
      debug('FORWARD [%s] %s => %s', req.method, req.url, opts.target)
      rocky.proxy.web(req, res, opts, eventProxy('forward'))
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
      var opts = _.assign({}, opts, { target: url })

      route.emit('replay', opts, req, res)
      rocky.proxy.web(req, res, opts, eventProxy('replay'))

      debug('REPLAY  [%s] %s => %s', req.method, req.url, url)
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
