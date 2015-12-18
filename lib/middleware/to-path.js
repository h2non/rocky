const assign = require('lodash').assign

module.exports = function (path, args) {
  return function (req, res, next) {
    const params = assign({}, req.params, args)

    // Generate the new path
    const newPath = replace(path, params)

    // Save the original URL
    if (!req.originalUrl) req.originalUrl = req.url

    // If route matches, normalize it
    req.url = req.route
      ? wildcard(newPath, req)
      : newPath

    next()
  }
}

function replace (path, params) {
  return Object.keys(params).reduce(function (path, param) {
    const value = params[param] || ''
    const regex = new RegExp('\:' + param, 'g')
    return path.replace(regex, value)
  }, path)
}

function wildcard (path, req) {
  const reqWildcard = req.route.path.indexOf('*')
  const pathWildcard = path.indexOf('*')

  if (~reqWildcard && ~pathWildcard) {
    return path.replace('*', req.originalUrl.slice(reqWildcard))
  }

  return path
}
