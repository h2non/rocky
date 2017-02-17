const HttpProxy = require('http-proxy')
const parseUrl = require('url').parse
const Readable = require('stream').Readable
const retry = require('../retry')
const error = require('../../../error')
const helpers = require('../../../helpers')

module.exports = function forward (route, opts, req, res, done) {
  // Clone request object to avoid side-effects on mutations
  const forwardReq = helpers.cloneRequest(req, opts)

  // Run the forward phase middleware
  route.mw.run('forward', forwardReq, res, forwarder)

  function forwarder (err) {
    if (err) {
      route.emit('route:error', err, req, res)
      return done(error.reply(err, res))
    }

    const opts = forwardReq.rocky.options

    // Expose rocky params in the response for traceability
    res.rocky = forwardReq.rocky

    // Balance the request, if configured
    const balance = opts.balance
    if (balance && balance.length && !opts.target) {
      opts.target = helpers.permute(balance)
    }

    // Overwrite host header if necessary based on user options
    defineHostHeader(forwardReq, opts)

    // Reply with an error if target server was not defined
    if (!opts.target) {
      return done(missingTargetError(route, req, res))
    }

    forwardStrategy(route, opts, forwardReq, res, resolver)
  }

  function resolver (err) {
    if (err) {
      route.emit('proxy:error', err, forwardReq, res)
      return done(error.reply(err, res))
    }

    route.emit('proxy:response', forwardReq, res)
    done(null, res)
  }
}

function forwardStrategy (route, opts, req, res, resolver) {
  if (opts.retry) {
    forwardRetryRequest(route, opts, req, res, resolver)
  } else {
    forwardRequest(route, opts, req, res, resolver)
  }
}

function forwardRetryRequest (route, opts, forwardReq, res, done) {
  var closed = false
  var resolver = helpers.once(resolve)

  forwardReq.once('close', onClose)
  retry(opts.retry, res, task, resolver, onRetry)

  function onClose () {
    closed = true
  }

  function onRetry (err, res) {
    route.emit('proxy:retry', err, forwardReq, res)
  }

  function task (next) {
    if (closed) {
      resolver(new Error('Peer connection closed'))
      return next()
    }
    if (res.headersSent) {
      return next()
    }
    forwardRequest(route, opts, forwardReq, res, next)
  }

  function resolve (err) {
    forwardReq.removeListener('close', onClose)
    done(err)
  }
}

function defineHostHeader (forwardReq, opts) {
  const forwardHost = opts.forwardHost
  if (!forwardHost) return

  const headers = forwardReq.headers
  if (typeof forwardHost === 'string') {
    headers.host = forwardHost
    return forwardHost
  }

  const target = forwardReq.rocky.options.target || opts.target
  if (!target) return

  const host = target === Object(target)
    ? target.host
    : parseUrl(target).host

  if (host) headers.host = host
}

function forwardRequest (route, opts, forwardReq, res, done) {
  const proxy = new HttpProxy()

  // Use the proper request body
  useRequestBody(forwardReq, opts)

  // Prepare propagation of proxy events to parent bus
  propagateEvents(proxy, route, finisher)

  // Finally forward the request
  proxy.web(forwardReq, res, opts, finisher)

  function finisher () {
    cleanup(proxy)
    done.apply(null, arguments)
  }
}

function useRequestBody (forwardReq, opts) {
  var body = forwardReq.body

  // Forward original body instead of the intercepted one, if enabled
  if (opts.forwardOriginalBody && forwardReq._originalBody) {
    forwardReq.headers['content-length'] = forwardReq._originalBodyLength
    body = forwardReq._originalBody
  }

  // If body is present, use it as buffer stream
  if (body && (typeof body === 'string' || body instanceof Buffer)) {
    opts.buffer = createBodyStream(body)
  }
}

function propagateEvents (proxy, route, next) {
  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    route.emit('proxyReq', proxyReq, req, res, options)
  })
  proxy.on('proxyRes', function (proxyRes, req, res) {
    route.emit('proxyRes', proxyRes, req, res)
    next(null, proxyRes)
  })
}

function cleanup (proxy) {
  proxy.removeAllListeners('proxyReq')
  proxy.removeAllListeners('proxyRes')
  proxy.removeAllListeners('error')
}

function createBodyStream (body) {
  const stream = new Readable()
  stream.push(body)
  stream.push(null)
  return stream
}

function missingTargetError (route, req, res) {
  const err = new Error('Cannot forward: missing target URL')
  route.emit('route:error', err, req, res)
  error.reply(err, res)
  return err
}
