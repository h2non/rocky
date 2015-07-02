var Rocky = require('./lib/rocky')

module.exports = rocky

function rocky(opts) {
  return new Rocky(opts)
}

rocky.httpProxy  = require('http-proxy')
rocky.create     = require('./lib/create')
rocky.middleware = require('./lib/middleware')
rocky.VERSION    = require('./package.json').version
