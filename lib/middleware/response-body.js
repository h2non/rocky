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
    var headArgs = null

    var _end = res.end
    var _write = res.write
    var _writeHead = res.writeHead

    // Wrap native http.OutgoingMessage methods
    res.writeHead = function (code, message, headers) {
      headArgs = arguments
    }

    res.write = function (data) {
      if (data) {
        length += +data.length || 0
        buf.push(data)
      }
      var cb = getCallback(arguments)
      if (cb) cb()
    }

    res.end = function (data) {
      if (data && typeof data !== 'function') {
        buf.push(data)
      }

      var body = Buffer.concat(buf, length)

      // Restore methods
      res.writeHead = _writeHead
      res.write = _write
      res.end = _end

      // Expose the body
      res.body = res._originalBody = body

      // Clean references to prevent leaks
      buf = body = _end = _write = null

      var cb = getCallback(arguments)
      middleware(req, res, finisher(cb))
    }

    function finisher(cb) {
      return function (err, body, encoding) {
        if (err) {
          res.statusCode = +err.status || 500
          return res.end(err.message || err)
        }

        if (!res.headersSent && headArgs) {
          res.writeHead.apply(res, headArgs)
        }

        if (body) {
          res.write(body, encoding)
          res.body = body
        }

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
