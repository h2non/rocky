const http     = require('http')
const https    = require('https')
const parseUrl = require('url').parse
const setupReq = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay(req, route) {
  return function (opts) {
    if (!opts || !opts.target) return

    if (typeof opts === 'string') {
      opts = { target: opts }
    }

    const params = defineParams(req, opts)
    route.proxy.emit('replay:start', params, opts, req)
    request(opts, params, route, req)
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

function request(opts, params, route, req) {
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
