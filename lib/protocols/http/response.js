const Emitter = require('events').EventEmitter

module.exports = StubResponse

/**
 * node.js http.ServerResponse API implementation.
 * Used as stub for replayed requests
 */
function StubResponse() {
  Emitter.call(this)
  this._bodySent = false
  this._headers = {}
  this._body = null
  this._status = null
  this.headerSent = false
}

StubResponse.prototype = Object.create(Emitter.prototype)

StubResponse.prototype._isFinished = function () {
  return this.headerSent && this._bodySent
}

StubResponse.prototype.setHeader = function (name, value) {
  if (this.headerSent) {
    throw new Error('Can\'t set headers after they are sent.')
  }
  this._headers[name] = value
}

StubResponse.prototype.getHeader = function (name) {
  return this._headers[name]
}

StubResponse.prototype.removeHeader = function (name) {
  delete this._headers[name]
}

StubResponse.prototype.writeHead = function (status) {
  if (this.headerSent) {
    throw new Error('Can\'t render headers after they are sent to the client.')
  }
  this.headerSent = true
  this._status = status
}

StubResponse.prototype.write = function (data) {
  if (this._bodySent) {
    throw new Error('Can\'t write to already finished response.')
  }
  this._body = this._body ? this._body + data.toString() : data.toString()
}

StubResponse.prototype.end = function(data) {
  if (data) {
    this.write(data)
  }

  this._bodySent = true
  this.emit('end')
}
