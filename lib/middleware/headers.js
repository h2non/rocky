module.exports = function (headers) {
  return function (req, res, next) {
    Object.keys(headers).forEach(function (header) {
      req.headers[header] = headers[header]
    })
    next()
  }
}
