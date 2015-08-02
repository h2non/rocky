const Rocky = require('./lib/rocky')

module.exports = rocky

/**
 * API factory
 */

function rocky(opts) {
  return new Rocky(opts)
}

/**
 * Expose internal modules as static members
 */

rocky.Rocky          = Rocky
rocky.Base           = require('./lib/base')
rocky.Route          = require('./lib/route')
rocky.Dispatcher     = require('./lib/dispatcher')
rocky.middleware     = require('./lib/middleware')
rocky.passthrough    = require('./lib/passthrough')
rocky.MiddlewarePool = require('./lib/mwpool')

/**
 * Expose http-proxy module (mostly for hacking purposes)
 */

rocky.httpProxy = require('http-proxy')

/**
 * Expose current version
 */

rocky.VERSION = require('./package.json').version
