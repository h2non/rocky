const zlib = require('zlib')
const partial = require('lodash').partial
const helpers = require('../helpers')

module.exports = function responseBody (middleware, filter) {
  return function (req, res, next) {
    // Apply request filter, if present
    if (filter && !helpers.filterRequest(filter, res)) {
      return next()
    }

    // If body is already present, just continue with it
    if (res.body) {
      return middleware(req, res, next)
    }

    // If connection was closed, stop with explicit error
    if (req.socket.destroyed) {
      return next('connection closed')
    }

    // Cache http.ServerResponse prototype chain for future use
    const resProto = Object.getPrototypeOf(res)

    var buf = []
    var length = 0
    var closed = false
    var headArgs = null

    // Listen for client connection close
    req.socket.once('close', onClose)

    // Wrap native http.ServerResponse methods
    // to intercept data and handle the state
    res.writeHead = function (code, headers) {
      // Explicitly set status code property
      if (typeof code === 'number') {
        res.statusCode = code
      }
      headArgs = helpers.toArray(arguments)
    }

    res.write = function (data) {
      const cb = getCallback(arguments)
      if (isEnded()) {
        cb && cb()
        return true
      }

      if (data) {
        length += Buffer.byteLength(data)
        buf.push(data)
      }

      if (cb) cb()
      return true
    }

    res.end = function (data, encoding) {
      const cb = getCallback(arguments)
      if (isEnded()) return cb && cb()

      if (data && typeof data !== 'function') {
        buf.push(data)
      }

      var body = ''
      try { body = Buffer.concat(buf, length) } catch (e) {}

      // Expose the current body buffer
      res.body = res._originalBody = body

      if (isGzip(res, headArgs)) {
        res.body = inflate(body)
      }

      // Expose the original body encoding
      if (typeof encoding === 'string') {
        res._originalEncoding = encoding
      }

      // Parse body for convenience
      if (isJSON(res)) parseJSON(res)

      // Restore native methods
      restore()

      // Trigger response middleware stack
      middleware(req, res, partial(finisher, cb))
    }

    function isEnded () {
      return closed || buf === null
    }

    function onClose () {
      closed = true
      cleanupAndRestore()
    }

    function finisher (cb, err, body, encoding) {
      if (isEnded() || res.headersSent) return cb && cb()

      if (err) {
        res.statusCode = +err.status || 500
        return res.end(err.message || err)
      }

      // Write the final body in the stream
      const finalEncoding = encoding || res._originalEncoding
      res.body = body == null ? res.body : body

      if (isGzip(res, headArgs)) {
        res.body = deflate(res.body)
      }

      // Set content length response header
      setContentLength(res)

      // Remove content length header if transfer encoding is chuncked.
      // See: https://github.com/request/request/issues/2091
      if (res.getHeader('transfer-encoding') === 'chunked') {
        res.removeHeader('content-length')
      }

      // Write the response head
      if (headArgs && !res.headersSent) {
        res.writeHead.apply(res, headArgs)
      }

      // Write body
      resProto.write.call(res, res.body, finalEncoding)

      // Clean references to prevent leaks
      cleanup()

      // Ensure we "uncork" the stream before ending it
      res.socket.uncork()

      // Send EOF
      resProto.end.call(res, cb)
    }

    function cleanupAndRestore () {
      restore()
      cleanup()
    }

    function restore () {
      const proto = Object.getPrototypeOf(res)
      res.end = proto.end
      res.write = proto.write
      res.writeHead = proto.writeHead
    }

    function cleanup () {
      buf = length = headArgs = null
      req.socket.removeListener('close', onClose)
    }

    next()
  }
}

function setContentLength (res) {
  if (typeof res.body === 'string') {
    return res.setHeader('content-length', Buffer.byteLength(res.body))
  }
  if (Buffer.isBuffer(res.body)) {
    return res.setHeader('content-length', res.body.length)
  }
  res.setHeader('content-length', 0)
}

function parseJSON (res) {
  if (res.json) return
  const body = res.body || ''
  try {
    res.json = JSON.parse(body.toString())
  } catch (e) {
    res.parseError = e
  }
}

function isGzip (res, head) {
  return (res.body && res.getHeader('content-encoding') === 'gzip') ||
    (head && head[1] && head[1]['content-encoding'] === 'gzip') ||
    false
}

function isJSON (res) {
  return /json/i.test(res.getHeader('content-type'))
}

function zlibProxy (fn, body) {
  try {
    return fn(body)
  } catch (e) {
    return body
  }
}

function inflate (body) {
  return zlibProxy(zlib.gunzipSync, body)
}

function deflate (body) {
  return zlibProxy(zlib.gzipSync, body)
}

function getCallback (args) {
  for (var i = 0, l = args.length; i < l; i += 1) {
    if (typeof args[i] === 'function') {
      return args[i]
    }
  }
}
