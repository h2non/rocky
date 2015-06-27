module.exports = function headers(headers) {
  return function (req, res, next) {
    if (!headers) { return }
    Object.keys(headers).forEach(function (header) {
      req.headers[header] = headers[header]
    })
    next()
  }
}
