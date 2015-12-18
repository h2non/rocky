module.exports = function (path, args) {
  return function (req, res, next) {
    const params = args || req.params || {}

    Object.keys(params).forEach(function (param) {
      var value = params[param] || ''
      var regex = new RegExp('\:' + param, 'g')
      path = path.replace(regex, value)
    })

    if (req.route) {
      var reqWildcard = req.route.path.indexOf('*')
      var pathWildcard = path.indexOf('*')
      if (reqWildcard !== -1 && pathWildcard !== -1) {
        path = path.replace('*', req.originalUrl.slice(req.route.path.indexOf('*')))
      }
    }

    req.url = path
    next()
  }
}
