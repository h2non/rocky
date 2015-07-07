const Emitter = require('events').EventEmitter

module.exports = ServerResponse

/**
 * http.ServerResponse API implementation.
 * Used as stub for replayed requests
 */
function ServerResponse() {
  var bodySent = false
  Emitter.call(this)

  this._headers = {}
  this._body = null
  this._status = null
  this.headerSent = false

  this._isFinished = function() {
    return this.headerSent && bodySent
  }

  this.setHeader = function (name, value) {
    if (this.headerSent) {
      throw new Error('Can\'t set headers after they are sent.')
    }
    this._headers[name] = value
  }

  this.getHeader = function (name) {
    return this._headers[name]
  }

  this.removeHeader = function (name) {
    delete this._headers[name]
  }

  this.writeHead = function (status) {
    if (this.headerSent) {
      throw new Error('Can\'t render headers after they are sent to the client.')
    }
    this.headerSent = true
    this._status = status
  }

  this.write = function (data) {
    if (bodySent) {
      throw new Error('Can\'t write to already finished response.')
    }
    this._body = this._body ? this._body + data.toString() : data.toString()
  }

  this.end = function(data) {
    if (data) {
      this.write(data)
    }

    bodySent = true
    this.emit('end')
  }
}

ServerResponse.prototype = Object.create(Emitter.prototype)
