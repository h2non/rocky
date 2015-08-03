const common = require('./common')

module.exports = function transformResponseBody(middleware, filter) {
  return function (req, res, next) {
    // Apply the request filter is necessary
    if (filter && !common.filterRequest(filter, res)) {
      return next()
    }

    // If body field is already present, just continue with it
    if (res.body) {
      return middleware(req, res, next)
    }

    var buf = []
    var length = 0
    var closed = false
    var headArgs = null

    var _end = res.end
    var _write = res.write
    var _writeHead = res.writeHead

    // Wrap native http.OutgoingMessage methods
    res.writeHead = function (code, message, headers) {
      headArgs = Array.apply(null, arguments)
    }

    res.write = function (data) {
      var cb = getCallback(arguments)
      if (closed) return cb && cb()

      if (data) {
        length += +data.length || 0
        buf.push(data)
      }

      if (cb) cb()
    }

    res.end = function (data, encoding) {
      var cb = getCallback(arguments)
      if (closed) return cb && cb()

      if (data && typeof data !== 'function') {
        buf.push(data)
      }

      var body = Buffer.concat(buf, length)

      // Expose the body
      res.body = res._originalBody = body

      // Expose the original body encoding
      if (typeof encoding === 'string') {
        res._originalEncoding = encoding
      }

      // Restore and clean references
      cleanupAndRestore()

      middleware(req, res, finisher(cb))
    }

    // Listen for client connection close
    req.on('close', onClose)

    function onClose() {
      closed = true
      cleanupAndRestore()
    }

    function cleanupAndRestore() {
      // Restore methods
      res.writeHead = _writeHead
      res.write = _write
      res.end = _end

      // Clean references to prevent leaks
      buf = body = _end = _write = headArgs = null
      req.removeListener('close', onClose)
    }

    function finisher(cb) {
      return function (err, body, encoding) {
        if (closed) return cb && cb()

        if (err) {
          res.statusCode = +err.status || 500
          return res.end(err.message || err)
        }

        if (!res.headersSent && headArgs) {
          res.writeHead.apply(res, headArgs)
        }

        // Write the final body in the stream
        var finalBody = body || res.body
        var finalEncoding = encoding || res._originalEncoding
        res.write(finalBody, finalEncoding)

        // Expose the new body int he response object, if exists
        if (body) res.body = body

        // Send EOF
        res.end(cb)
      }
    }

    next()
  }
}

function getCallback(args) {
  for (var i = 0, l = args.length; i < l; i += 1) {
    if (typeof args[i] === 'function') {
      return args[i]
    }
  }
}
