
exports.toPath = function (path, args) {
  return function (req, res, next) {
    if (args) {
      req.params = args
      Object.keys(args).forEach(function (arg) {
        var value = args[arg] || ''
        var regex = new RegExp('\:' + arg, 'g')
        path = path.replace(regex, value)
      })
    }
    req.url = path
    next()
  }
}

exports.changeHost = function (host) {
  return function (req, res, next) {
    req.headers.host = host
    next()
  }
}

exports.extendHeaders = function (headers) {
  return function (req, res, next) {
    if (!headers) return headers
    Object.keys(headers).forEach(function (header) {
      req.headers[header] = headers[header]
    })
    next()
  }
}
