module.exports = function (host) {
  return function (req, res, next) {
    req.headers.host = host
    next()
  }
}
