const Rocky = require('./lib/rocky')

module.exports = rocky

/**
 * Rocky API factory
 *
 * @param {Object} opts
 * @constructor
 * @class rocky
 */

function rocky (opts) {
  return new Rocky(opts)
}

/**
 * Rocky class constructor
 *
 * @property {Function} Rocky
 * @static
 */

rocky.Rocky = Rocky

/**
 * Base class constructor
 *
 * @property {Function} Base
 * @static
 */

rocky.Base = require('./lib/base')

/**
 * Route class constructor
 *
 * @property {Function} Route
 * @static
 */

rocky.Route = require('./lib/route')

/**
 * Expose protocol specific implementation
 *
 * @property {Object} protocols
 * @static
 */

rocky.protocols = require('./lib/protocols')

/**
 * Expose built-in middleware functions
 *
 * @property {Object} middleware
 * @static
 */

rocky.middleware = require('./lib/middleware')

/**
 * Export the http-proxy module
 *
 * @property {Object} httpProxy
 * @static
 */

rocky.httpProxy = require('http-proxy')

/**
 * Current rocky version
 *
 * @property {String} version
 * @static
 */

rocky.VERSION = require('./package.json').version
