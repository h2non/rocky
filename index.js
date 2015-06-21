var Rocky = require('./lib/rocky')

module.exports = rocky

function rocky(opts) {
  return new Rocky(opts)
}

rocky.httpProxy = require('http-proxy')
rocky.VERSION = require('./package.json').version
