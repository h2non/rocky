const HttpProxy = require('http-proxy')

module.exports = function (opts, req, socket, head, done) {
  var proxy = new HttpProxy(opts)

  proxy.on('open', function () {
    done(null, req, socket)
  })

  proxy.ws(req, socket, head, function (err, req, socket) {
    console.log('>>', err)
    done(err, req, socket)
  })
}
