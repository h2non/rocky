const http         = require('http')
const https        = require('https')
const parseUrl     = require('url').parse
const common       = require('./common')
const FakeResponse = require('./response')
const assign       = require('lodash').assign
const setupReq     = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay(route, req, opts) {
  var replays = route.replays && route.replays.length
    ? route.replays
    : req.rocky.proxy.replays

  normalize(replays, opts)
    .forEach(replayRequest(route, req))
}

function normalize(replays, opts) {
  return replays
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
    return assign({}, opts, replay)
  })
}

function replayRequest(route, req) {
  return function (opts) {
    // Clone the request/response to avoid side-effects
    var replayRes = new FakeResponse
    var replayReq = common.cloneRequest(req, opts)
    var replayOpts = replayReq.rocky.options
    replayReq.rocky.isReplay = true

    // Dispatch replay middleware per each request
    route.mw.run('replay', replayReq, replayRes, replayer)

    function replayer(err) {
      if (err) {
        return route.proxy.emit('replay:error', err, replayReq, replayRes)
      }

      const params = setRequestParams(replayReq, replayOpts)
      request(params, replayOpts, route, replayReq)
    }
  }
}

function setRequestParams(req, opts) {
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

  if (opts.replayOriginalBody && req._originalBodyLength) {
    params.headers['content-length'] = req._originalBodyLength
  }

  return params
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

  request.on('end', function () {
    request.removeAllListeners('error')
  })

  // Write data to request body
  const body = opts.replayOriginalBody
    ? req._originalBody
    : req.body

  if (!body) {
    return req.pipe(request)
  }

  request.write(body, req.body._newBodyEncoding)
  request.end()
}

function httpModule(opts) {
  return opts.target.indexOf('https://') === 0
    ? https
    : http
}
