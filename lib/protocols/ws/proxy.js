const HttpProxy = require('http-proxy')

module.exports = function wsProxy (opts, req, socket, head, done) {
  const proxy = new HttpProxy(opts)

  function onOpen () { done() }
  proxy.once('open', onOpen)

  proxy.ws(req, socket, head, function (err, req, socket) {
    done(err, req, socket)
    proxy.removeListener('open', onOpen)
  })
}
