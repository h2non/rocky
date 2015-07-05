const http        = require('http')
const https       = require('https')
const parseUrl    = require('url').parse
const reqParams   = require('http-proxy/lib/http-proxy/common').setupOutgoing

module.exports = function replay(req, route) {
  return function (opts) {
    if (!opts || !opts.target) return

    var url = parseUrl(opts.target)
    var params = reqParams(opts.ssl || {}, opts, req)
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

    route.proxy.emit('replay:start', params, opts, req)
    request(opts, params, route, req)
  }
}

function request(opts, params, route, req) {
  var request = httpModule(opts).request(params)

  var timeout = +opts.timeout || +opts.proxyTimeout
  if (timeout) {
    request.setTimeout(timeout)
  }

  request.once('error', function (err) {
    route.proxy.emit('replay:error', err, req)
  })

  // Write data to request body
  var body = opts.forwardOriginalBody && req._originalBody
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
  return opts.target.indexOf('https://') === 0
    ? https
    : http
}
