const http         = require('http')
const https        = require('https')
const parseUrl     = require('url').parse
const common       = require('../common')
const retry        = require('../retry')
const FakeResponse = require('../http/response')
const assign       = require('lodash').assign
const setupReq     = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay(route, opts, req, res, next) {
  var replays = route.replays && route.replays.length
    ? route.replays
    : req.rocky.proxy.replays

  if (!replays || !replays.length) {
    return next()
  }

  var targets = normalize(replays, opts)
  var replayer = replayRequest(route, req)

  replayStrategy(targets, opts, replayer, next)
}

function replayStrategy(replays, opts, replayer, done) {
  if (opts.replaySequentially) {
    common.eachSeries(replays, replayer, done)
  } else {
    replays.forEach(replayer)
    done()
  }
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
  return function (opts, next) {
    // Clone the request/response to avoid side-effects
    var replayRes = new FakeResponse
    var replayReq = common.cloneRequest(req, opts)
    replayReq.rocky.isReplay = true

    next = typeof next === 'function' ? next : function () {}

    // Dispatch replay middleware per each request
    route.mw.run('replay', replayReq, replayRes, replayer)

    function replayer(err) {
      if (err) {
        return route.emit('replay:error', err, replayReq, replayRes)
      }

      if (replayReq.stopReplay === true) {
        return route.emit('replay:stop', err, replayReq, replayRes)
      }

      const params = setRequestParams(replayReq, opts)
      route.emit('replay:start', params, opts, req)

      if (opts.retry) {
        retryRequest(route, params, opts, replayReq, replayRes, handler)
      } else {
        request(params, opts, replayReq, handler)
      }

      function handler(err) {
        if (err) {
          route.emit('replay:error', err, req)
          return next(err)
        }

        route.emit('replay:end', params, opts, req)
        next()
      }
    }
  }
}

function replayHandler(route, params, opts, req, next) {
  return function (err) {
    if (err) {
      route.emit('replay:error', err, req)
      return next(err)
    }

    route.emit('replay:end', params, opts, req)
    next()
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

function retryRequest(route, params, opts, req, res, resolver) {
  function task(cb) {
    request(params, opts, req, cb)
  }

  function onRetry(err) {
    route.emit('replay:retry', err, req, res)
  }

  retry(opts.retry, res, task, resolver, onRetry)
}

function request(params, opts, req, done) {
  const request = httpModule(opts).request(params)

  const timeout = +opts.proxyTimeout || +opts.timeout
  if (timeout) {
    request.setTimeout(timeout)
  }

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

function clean(request) {
  request.removeAllListeners('error')
  request.removeAllListeners('response')
  request.removeAllListeners('close')
}

function httpModule(opts) {
  return opts.target.indexOf('https://') === 0
    ? https
    : http
}
