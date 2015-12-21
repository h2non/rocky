const http = require('http')
const https = require('https')
const parseUrl = require('url').parse
const assign = require('lodash').assign
const retry = require('../retry')
const ResponseStub = require('../response')
const helpers = require('../../../helpers')
const setupReq = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay (route, opts, req, res, next) {
  const replays = getReplays(route, req)
  if (!replays.length) return next()

  const targets = normalize(replays, opts)
  const replayer = replayRequest(route, req)

  useReplayStrategy(targets, opts, replayer, next)
}

function useReplayStrategy (targets, opts, replayer, done) {
  if (opts.replaySequentially) {
    helpers.eachSeries(targets, replayer, done)
  } else {
    helpers.eachConcurrently(targets, replayer, done)
  }
}

function getReplays (route, req) {
  const opts = req.rocky.options
  if (opts && Array.isArray(opts.replays) && opts.replays.length) {
    return opts.replays
  }

  if (route.replays && route.replays.length) {
    return route.replays
  }

  const replays = req.rocky.proxy.replays
  if (replays) {
    return replays
  }

  return []
}

function replayRequest (route, req) {
  return function (opts, next) {
    next = typeof next === 'function' ? next : noop

    // Clone the request/response to avoid side-effects
    const replayRes = new ResponseStub()
    const replayReq = helpers.cloneRequest(req, opts)
    replayReq.rocky.isReplay = true

    // Dispatch replay middleware per each request
    const doReplay = replayer(route, replayReq, replayRes, opts, next)
    route.mw.run('replay', replayReq, replayRes, doReplay)
  }
}

function replayer (route, replayReq, replayRes, opts, next) {
  return function doReplay (err) {
    if (err) {
      return route.emit('replay:error', err, replayReq, replayRes)
    }

    if (replayReq.stopReplay === true) {
      return route.emit('replay:stop', err, replayReq, replayRes)
    }

    const params = setRequestParams(replayReq, opts)
    route.emit('replay:start', params, opts, replayReq)

    const handler = replayHandler(route, params, opts, replayReq, next)

    if (opts.retry) {
      retryRequest(route, params, opts, replayReq, replayRes, handler)
    } else {
      request(params, opts, replayReq, handler)
    }
  }
}

function replayHandler (route, params, opts, req, next) {
  return function (err) {
    if (err) {
      route.emit('replay:error', err, req)
      return next(err)
    }

    route.emit('replay:end', params, opts, req)
    next()
  }
}

function setRequestParams (req, opts) {
  const target = req.rocky.options.target || opts.target
  const url = parseUrl(target)
  const params = setupReq(opts.ssl || {}, opts, req)

  params.hostname = url.hostname
  params.port = url.port

  const forwardHost = opts.forwardHost
  if (typeof forwardHost === 'string') {
    params.headers.host = forwardHost
  } else if (forwardHost) {
    params.headers.host = url.host
  }

  if ((req.method === 'DELETE' || req.method === 'OPTIONS') && !req.headers['content-length']) {
    params.headers['content-length'] = '0'
  }

  if (opts.replayOriginalBody && req._originalBodyLength) {
    params.headers['content-length'] = req._originalBodyLength
  }

  return params
}

function retryRequest (route, params, opts, req, res, handler) {
  function task (cb) {
    if (res.headersSent) return cb()
    request(params, opts, req, cb)
  }

  function onRetry (err, res) {
    route.emit('replay:retry', err, req, res)
  }

  retry(opts.retry, res, task, handler, onRetry)
}

function request (params, opts, req, done) {
  const request = httpModule(opts).request(params)

  const timeout = +opts.proxyTimeout || +opts.timeout
  if (timeout) request.setTimeout(timeout)

  var response = null
  request.once('response', function (res) {
    response = res
  })

  request.on('error', function (err) {
    done(err)
    clean(request)
  })

  request.on('close', function () {
    done(clean(request), response)
    response = null
  })

  // Write the property data in the request body
  const body = opts.replayOriginalBody
    ? req._originalBody
    : req.body

  if (!body) {
    return req.pipe(request)
  }

  request.write(body, req.body._newBodyEncoding)
  request.end()
}

function normalize (replays, opts) {
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

function clean (request) {
  request.removeAllListeners('error')
  request.removeAllListeners('response')
  request.removeAllListeners('close')
}

function httpModule (opts) {
  return opts.target.indexOf('https://') === 0
    ? https
    : http
}

function noop () {}
