module.exports = function (path, args) {
  return function (req, res, next) {
    const params = args || req.params || {}
    var newPath = path

    Object.keys(params).forEach(function (param) {
      var value = params[param] || ''
      var regex = new RegExp('\:' + param, 'g')
      newPath = newPath.replace(regex, value)
    })

    if (req.route) {
      var reqWildcard = req.route.path.indexOf('*')
      var pathWildcard = newPath.indexOf('*')
      if (reqWildcard !== -1 && pathWildcard !== -1) {
        newPath = newPath.replace('*', req.originalUrl.slice(req.route.path.indexOf('*')))
      }
    }

    req.url = newPath
    next()
  }
}
