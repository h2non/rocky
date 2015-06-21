var _         = require('lodash')
var httpProxy = require('http-proxy')
var debug     = require('debug')('rocky:proxy')

module.exports = function createProxy(config) {
  var proxyOpts = _.clone(config)
  var proxy = httpProxy.createProxy(proxyOpts)

  proxy.on('proxyReq', onProxyRequest)
  proxy.on('error', onProxyError)

  return proxy

  function onProxyRequest(proxyReq, req, res, opts) {
    proxyReq.setHeader('X-Powered-By', 'rocky HTTP proxy')

    proxyReq.setHeader('X-Forwarded-Proto',
      req.headers['x-forwarded-proto'] || req.protocol)

    proxyReq.setHeader('X-Forwarded-Host',
      req.headers['x-forwarded-host'] || req.headers.host)

    proxyReq.setHeader('X-Forwarded-For',
      req.headers['x-forwarded-for'] || req.connection.remoteAddress)

    if (config.forwardHost) {
      proxyReq.setHeader('Host',
        opts.target.host + ':' + (+opts.target.port || 80))
    }
  }

  function onProxyError(err, req) {
    debug('proxy error: [%s] %s => %s',
      req.method, req.url, err.message || err)
  }
}
