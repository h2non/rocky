var Rocky = require('./lib/rocky')

module.exports = rocky

function rocky(opts) {
  return new Rocky(opts)
}

rocky.Rocky          = Rocky
rocky.Base           = require('./lib/base')
rocky.Route          = require('./lib/route')
rocky.Dispatcher     = require('./lib/dispatcher')
rocky.middleware     = require('./lib/middleware')
rocky.passthrough    = require('./lib/passthrough')
rocky.MiddlewarePool = require('./lib/mwpool')
rocky.httpProxy      = require('http-proxy')
rocky.VERSION        = require('./package.json').version
