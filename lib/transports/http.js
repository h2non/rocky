const HttpProxy = require('http-proxy').HttpProxy

module.exports = Http

function Http() {
  this.proxy = new HttpProxy
}

Http.prototype.transport = function (req, res) {

}
