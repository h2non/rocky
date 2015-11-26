const http = require('http')
const https = require('https')
const wsHandler = require('./handlers/ws')
const httpHandler = require('./handlers/http')

module.exports = function createServer (rocky) {
  const opts = rocky.opts
  const handler = httpHandler(rocky)

  const server = opts.ssl
    ? https.createServer(opts.ssl, handler)
    : http.createServer(handler)

  if (opts.ws) {
    server.on('upgrade', wsHandler(rocky))
  }

  server.listen(opts.port, opts.host)
  return server
}
