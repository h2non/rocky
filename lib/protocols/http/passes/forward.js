const HttpProxy = require('http-proxy')
const parseUrl  = require('url').parse
const Readable  = require('stream').Readable
const retry     = require('../retry')
const error     = require('../../../error')
const helpers   = require('../../../helpers')

module.exports = function forward(route, opts, req, res, done) {
  // Balance the request, if configured
  var balance = opts.balance
  if (balance && balance.length) {
    opts.target = helpers.permute(balance)
  }

  // Reply with an error if target server was not defined
  if (!opts.target) {
    return done(missingTarget(route, req, res))
  }

  // Clone request object to avoid side-effects
  var forwardReq = helpers.cloneRequest(req, opts)
  useProperHost(forwardReq, opts)

  // Run the forward phase middleware
  route.mw.run('forward', forwardReq, res, forwarder)

  function forwarder(err) {
    if (err) {
      route.emit('route:error', err, req, res)
      return done(error.reply(err, res))
    }

    forwardStrategy(route, opts, forwardReq, res, resolver)
  }

  function resolver(err) {
    if (err) {
      route.emit('proxy:error', err, forwardReq, res)
      return done(error.reply(err, res))
    }

    route.emit('proxy:response', forwardReq, res)
    done(null, res)
  }
}

function forwardStrategy(route, opts, req, res, resolver) {
  if (opts.retry) {
    forwardRetryRequest(route, opts, req, res, resolver)
  } else {
    forwardRequest(route, opts, req, res, resolver)
  }
}

function forwardRetryRequest(route, opts, forwardReq, res, done) {
  var closed = false

  forwardReq.once('close', onClose)
  retry(opts.retry, res, task, resolver, onRetry)

  function onClose() {
    closed = true
  }

  function onRetry(err) {
    route.emit('proxy:retry', err, forwardReq, res)
  }

  function task(next) {
    if (closed) {
      resolver(new Error('Peer connection closed'))
      return next()
    }
    forwardRequest(route, opts, forwardReq, res, next)
  }

  var called = false
  function resolver(err) {
    if (called) return
    called = true
    forwardReq.removeListener('close', onClose)
    done(err)
  }
}

function forwardRequest(route, opts, forwardReq, res, done) {
  var proxy = new HttpProxy

  function finisher() {
    cleanup(proxy)
    done.apply(null, arguments)
  }

  useRequestBody(forwardReq, opts)
  propagateEvents(proxy, route, finisher)

  proxy.web(forwardReq, res, opts, finisher)
}

function useProperHost(forwardReq, opts) {
  var forwardHost = opts.forwardHost
  if (!forwardHost) return

  var headers = forwardReq.headers
  if (typeof forwardHost === 'string') {
    return headers.host = forwardHost
  }

  var target = forwardReq.rocky.options.target || opts.target
  var host = null

  if (target === Object(target)) {
    host = target.host
  } else {
    host = parseUrl(target || '').host
  }

  if (host) headers.host = host
}

function useRequestBody(forwardReq, opts) {
  var body = forwardReq.body

  if (opts.forwardOriginalBody && forwardReq._originalBody) {
    forwardReq.headers['content-length'] = forwardReq._originalBodyLength
    body = forwardReq._originalBody
  }

  // If body is present, use it as buffer stream
  if (body) {
    opts.buffer = createBodyStream(body)
  }
}

function propagateEvents(proxy, route, next) {
  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    route.emit('proxyReq', proxyReq, req, res, options)
  })
  proxy.on('proxyRes', function (proxyRes, req, res) {
    route.emit('proxyRes', proxyRes, req, res)
    next(null, proxyRes)
  })
}

function cleanup(proxy) {
  proxy.removeAllListeners('proxyReq')
  proxy.removeAllListeners('proxyRes')
  proxy.removeAllListeners('error')
}

function createBodyStream(body) {
  var stream = new Readable
  stream.push(body)
  stream.push(null)
  return stream
}

function missingTarget(route, req, res) {
  var err = new Error('Cannot forward: missing target URL')
  route.emit('route:error', err, req, res)
  error.reply(err, res)
  return err
}
