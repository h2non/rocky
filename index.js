const Rocky = require('./lib/rocky')

/**
 * Rocky API factory
 *
 * @param {Object} opts
 * @constructor
 * @class rocky
 */

module.exports = Rocky

/**
 * Rocky class constructor
 *
 * @property {Function} Rocky
 * @static
 */

Rocky.Rocky = Rocky

/**
 * Base class constructor
 *
 * @property {Function} Base
 * @static
 */

Rocky.Base = require('./lib/base')

/**
 * Route class constructor
 *
 * @property {Function} Route
 * @static
 */

Rocky.Route = require('./lib/route')

/**
 * Expose protocol specific implementation
 *
 * @property {Object} protocols
 * @static
 */

Rocky.protocols = require('./lib/protocols')

/**
 * Expose built-in middleware functions
 *
 * @property {Object} middleware
 * @static
 */

Rocky.middleware = require('./lib/middleware')

/**
 * Export the http-proxy module
 *
 * @property {Object} httpProxy
 * @static
 */

Rocky.httpProxy = require('http-proxy')

/**
 * Current rocky version
 *
 * @property {String} version
 * @static
 */

Rocky.VERSION = require('./package.json').version
