exports.changeHost = function (host) {
  return function (req, res, next) {
    req.headers.host = host
    next()
  }
}

exports.extendHeaders = function (headers) {
  return function (req, res, next) {
    if (!headers) return
    Object.keys(headers).forEach(function (header) {
      req.headers[header] = headers[header]
    })
    next()
  }
}

exports.toPath = function (path, args) {
  return function (req, res, next) {
    var params = args || req.params || {}

    Object.keys(params)
    .forEach(function (param) {
      var value = params[param] || ''
      var regex = new RegExp('\:' + param, 'g')
      path = path.replace(regex, value)
    })

    req.url = path
    next()
  }
}

exports.transformResponseBody = function (middleware) {
  return function (req, res, next) {
    var buf = []
    var length = 0

    var _end = res.end
    var _write = res.write

    res.write = function (data) {
      if (!data) return
      length += +data.length || 0
      buf.push(data)
    }

    res.end = function (data) {
      if (data && typeof data !== 'function') {
        buf.push(data)
      }

      var args = arguments
      var body = Buffer.concat(buf, length)

      // Restore methods in the response object
      res.write = _write
      res.end = _end

      // Expose the body in the response object
      res.body = res.bodyBuffer = body

      // Clean references
      buf = body = _end = _write = null

      middleware(req, res, finisher)
    }

    function finisher(err, body, encoding) {
      if (body) {
        res.write(body, encoding) // may be split the body?
      }
      res.end()
    }

    next()
  }
}
