var Rocky = require('./lib/rocky')

module.exports = rocky

function rocky(opts) {
  return new Rocky(opts)
}

rocky.create      = require('./lib/create')
rocky.middlewares = require('./lib/middlewares')
rocky.httpProxy   = require('http-proxy')
rocky.VERSION     = require('./package.json').version
