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
    if (proxyReq.headersSent) { return } // Workaround, don't do this

    proxyReq.setHeader('X-Powered-By', 'rocky HTTP proxy')

    var protocol = req.headers['x-forwarded-proto'] || req.protocol
    if (protocol) proxyReq.setHeader('X-Forwarded-Proto', protocol)

    var host = req.headers['x-forwarded-host'] || req.headers.host
    if (host) proxyReq.setHeader('X-Forwarded-Host', host)

    var remote = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if (remote) proxyReq.setHeader('X-Forwarded-For', remote)

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
