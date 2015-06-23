var _ = require('lodash')
var rocky = require('..')

module.exports = function (config) {
  config = config || {}
  var proxy = rocky(config)

  if (config.forward) {
    proxy.forward(config.forward)
  }

  addReplayServers(proxy, config.replay)
  addRoutes(proxy, config)

  proxy.listen(+config.port || 3000)

  return proxy
}

function addRoutes(proxy, config) {
  var reservedKeys = ['forward', 'replay', 'target']

  var routes = Object.keys(config)
  .filter(function (key) {
    return !~reservedKeys.indexOf(key)
  })
  .map(function (path) {
    var route = config[path]
    if (route) route.path = path
    return route
  })
  .filter(function (route) {
    return _.isPlainObject(route)
  })
  .filter(function (route) {
    route.method = (route.method || 'all').toLowerCase()
    return isValidMethod(route.method)
  })
  .forEach(function (route) {
    var path = route.path
    var method = route.method
    var router = proxy[method](path)

    if (route.forward) {
      router.forward(route.forward)
    }

    var replays = route.replay
    addReplayServers(router, replays)
  })
}

function addReplayServers(proxy, replays) {
  if (typeof replays === 'string') {
    replays = [ replays ]
  }
  if (Array.isArray(replays)) {
    replays.forEach(function (url) {
      proxy.replay(url)
    })
  }
}

function isValidMethod(method) {
  return !!~['get', 'post', 'put', 'delete', 'patch', 'options', 'all'].indexOf(method)
}
