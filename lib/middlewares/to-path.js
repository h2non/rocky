module.exports = function toPath(path, args) {
  return function (req, res, next) {
    var params = args || req.params || {}

    Object.keys(params).forEach(function (param) {
      var value = params[param] || ''
      var regex = new RegExp('\:' + param, 'g')
      path = path.replace(regex, value)
    })

    req.url = path
    next()
  }
}
