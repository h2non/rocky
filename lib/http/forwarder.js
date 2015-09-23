const HttpProxy = require('http-proxy').HttpProxy

module.exports = Forwarder

function Forwarder() {
  this.proxy = new HttpProxy
}

Forwarder.prototype.forward = function (req, res) {
  this.proxy.web(req, res)
}

Forwarder.prototype.forward = function () {

}
