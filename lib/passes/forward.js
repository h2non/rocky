const common    = require('../common')
const errors    = require('../errors')
const retry     = require('../retry')
const HttpProxy = require('http-proxy')
const Readable  = require('stream').Readable

module.exports = function forward(route, opts, req, res, done) {
  // Balance the request, if configured
  var balance = opts.balance
  if (balance && balance.length) {
    opts.target = permute(balance)
  }

  // Reply with an error if target server was not defined
  if (!opts.target) {
    return done(missingTarget(route, req, res))
  }

  // Clone request object to avoid side-effects
  var forwardReq = common.cloneRequest(req, opts)

  // Run the forward middleware
  route.mw.run('forward', forwardReq, res, forwarder)

  function forwarder(err) {
    if (err) {
      route.emit('route:error', err, req, res)
      return done(errors.replyWithError(err, res))
    }

    forwardStrategy(route, opts, forwardReq, res, resolver)
  }

  function resolver(err) {
    if (err) {
      route.emit('proxy:error', err, forwardReq, res)
      return done(errors.replyWithError(err, res))
    }

    route.emit('proxy:response', forwardReq, res)
    done(null, res)
  }
}

function forwardStrategy(route, opts, req, res, resolver) {
  if (opts.retry) {
    proxyRetryRequest(route, opts, req, res, resolver)
  } else {
    proxyRequest(route, opts, req, res, resolver)
  }
}

function proxyRetryRequest(route, opts, forwardReq, res, resolver) {
  function task(cb) {
    proxyRequest(route, opts, forwardReq, res, cb)
  }

  function onRetry(err) {
    route.emit('proxy:retry', err, forwardReq, res)
  }

  retry(opts.retry, res, task, resolver, onRetry)
}

function proxyRequest(route, opts, forwardReq, res, done) {
  var proxy = new HttpProxy

  function finisher() {
    clean(proxy)
    done.apply(null, arguments)
  }

  useRequestBody(forwardReq, opts)
  propagateEvents(proxy, route, finisher)

  proxy.web(forwardReq, res, opts, function (err) {
    finisher(errors.replyWithError(err, res))
  })
}

function useRequestBody(forwardReq, opts) {
  var body = forwardReq.body

  if (opts.forwardOriginalBody && forwardReq._originalBody) {
    forwardReq.headers['content-length'] = forwardReq._originalBodyLength
    body = forwardReq._originalBody
  }

  // If body is present, overwrite the stream
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

function clean(proxy) {
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
  errors.replyWithError(err, res)
  return err
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
