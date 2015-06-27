module.exports = function transformResponseBody(middleware) {
  return function (req, res, next) {
    var buf = []
    var length = 0

    var _end = res.end
    var _write = res.write

    res.write = function (data) {
      if (!data) { return }
      length += +data.length || 0
      buf.push(data)
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
      res.body = res.rawBody = body

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
        res.write(body, encoding) // may be split the body?
      }

      res.end()
    }

    next()
  }
}
