const Emitter = require('events').EventEmitter

module.exports = StubServerResponse

/**
 * node.js http.ServerResponse API implementation.
 * Used as stub for replayed requests
 */
function StubServerResponse() {
  Emitter.call(this)
  this._bodySent = false
  this._headers = {}
  this._body = null
  this._status = null
  this.headerSent = false
}

StubServerResponse.prototype = Object.create(Emitter.prototype)

StubServerResponse.prototype._isFinished = function () {
  return this.headerSent && this._bodySent
}

StubServerResponse.prototype.setHeader = function (name, value) {
  if (this.headerSent) {
    throw new Error('Can\'t set headers after they are sent.')
  }
  this._headers[name] = value
}

StubServerResponse.prototype.getHeader = function (name) {
  return this._headers[name]
}

StubServerResponse.prototype.removeHeader = function (name) {
  delete this._headers[name]
}

StubServerResponse.prototype.writeHead = function (status) {
  if (this.headerSent) {
    throw new Error('Can\'t render headers after they are sent to the client.')
  }
  this.headerSent = true
  this._status = status
}

StubServerResponse.prototype.write = function (data) {
  if (this._bodySent) {
    throw new Error('Can\'t write to already finished response.')
  }
  this._body = this._body ? this._body + data.toString() : data.toString()
}

StubServerResponse.prototype.end = function(data) {
  if (data) {
    this.write(data)
  }

  this._bodySent = true
  this.emit('end')
}
