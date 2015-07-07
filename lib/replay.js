const http         = require('http')
const https        = require('https')
const _            = require('lodash')
const parseUrl     = require('url').parse
const FakeResponse = require('./response')
const setupReq     = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay(route, req, opts) {
  var replays = route.replays && route.replays.length
    ? route.replays
    : req.rocky.proxy.replays

  replays
  .filter(function (replay) {
    return replay
  })
  .map(function (replay) {
    if (typeof replay === 'string') {
      replay = { target: replay }
    }
    return replay
  })
  .map(function (replay) {
    return _.assign({}, opts, replay)
  })
  .forEach(replayRequest(route, req))
}

function replayRequest(route, req) {
  return function (opts) {
    // Clone the request/response to avoid side-effects
    var replayRes = new FakeResponse
    var replayReq = cloneRequest(req, opts)
    var replayOpts = replayReq.rocky.options
    replayReq.rocky.isReplay = true

    // Dispatch replay middleware per each request
    route.mw.run('replay', replayReq, replayRes, replayer)

    function replayer(err) {
      if (err) {
        return route.proxy.emit('replay:error', err, replayReq, replayRes)
      }

      const params = defineParams(replayReq, replayOpts)
      request(params, replayOpts, route, replayReq)
    }
  }
}

function defineParams(req, opts) {
  const url = parseUrl(opts.target)
  const params = setupReq(opts.ssl || {}, opts, req)
  params.hostname = url.hostname
  params.port = url.port

  if (opts.forwardHost) {
    params.headers.host = url.host
  }

  if ((req.method === 'DELETE' || req.method === 'OPTIONS')
     && !req.headers['content-length']) {
    params.headers['content-length'] = '0'
  }

  if (req._originalBodyLength) {
    params.headers['content-length'] = req._originalBodyLength
  }

  return params
}

function cloneRequest(req, opts) {
  var cloneReq = _.clone(req)
  cloneReq.headers = _.clone(req.headers)
  cloneReq.rocky = _.clone(req.rocky)
  cloneReq.rocky.options = _.cloneDeep(opts)
  return cloneReq
}

function request(params, opts, route, req) {
  route.proxy.emit('replay:start', params, opts, req)

  const request = httpModule(opts).request(params)

  const timeout = +opts.proxyTimeout || +opts.timeout
  if (timeout) {
    request.setTimeout(timeout)
  }

  request.once('error', function (err) {
    route.proxy.emit('replay:error', err, req)
  })

  // Write data to request body
  const body = opts.forwardOriginalBody && req._originalBody
    ? req._originalBody
    : req.body

  if (body) {
    request.write(body)
  }

  request.end(function clean() {
    request.removeAllListeners('error')
  })
}

function httpModule(opts) {
  return ~opts.target.indexOf('https://')
    ? https
    : http
}
