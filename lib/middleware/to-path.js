module.exports = function (path, args) {
  return function (req, res, next) {
    const params = args || req.params || {}

    const newPath = Object.keys(params).reduce(function (path, param) {
      const value = params[param] || ''
      const regex = new RegExp('\:' + param, 'g')
      return path.replace(regex, value)
    }, path)

    // Save the original URL
    if (!req.originalUrl) req.originalUrl = req.url

    // If route matched, normalize wildcard
    req.url = req.route
      ? normalizeWildcard(newPath, req)
      : newPath

    next()
  }
}

function normalizeWildcard (path, req) {
  const reqWildcard = req.route.path.indexOf('*')
  const pathWildcard = path.indexOf('*')

  if (~reqWildcard && ~pathWildcard) {
    return path.replace('*', req.originalUrl.slice(reqWildcard))
  }

  return path
}
