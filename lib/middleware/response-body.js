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

    var _end = res.end
    var _write = res.write

    res.write = function (data) {
      if (data) {
        length += +data.length || 0
        buf.push(data)
      }
    }

    res.end = function (data) {
      if (data && typeof data !== 'function') {
        buf.push(data)
      }

      var body = Buffer.concat(buf, length)

      // Restore methods
      res.write = _write
      res.end = _end

      // Expose the body
      res.body = res._originalBody = body

      // Clean references to prevent leaks
      buf = body = _end = _write = null

      middleware(req, res, finisher)
    }

    function finisher(err, body, encoding) {
      if (err) {
        res.statusCode = +err.status || 500
        return res.end(err.message || err)
      }

      if (body) {
        res.write(body, encoding)
        res.body = body
      }

      res.end()
    }

    next()
  }
}
