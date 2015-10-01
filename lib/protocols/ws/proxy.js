const HttpProxy = require('http-proxy')

module.exports = function (opts, req, socket, head, done) {
  var proxy = new HttpProxy(opts)

  function onOpen() { done() }

  proxy.once('open', onOpen)

  proxy.ws(req, socket, head, function (err, req, socket) {
    done(err, req, socket)
    proxy.removeListener('open', onOpen)
  })
}
