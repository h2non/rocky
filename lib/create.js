var _ = require('lodash')
var rocky = require('..')

var PORT = 3000

module.exports = function (config) {
  if (!config) {
    throw new TypeError('config argument is required')
  }
  return createProxy(config)
}

function createProxy(config) {
  var proxy = rocky(config)

  if (config.forward) {
    proxy.forward(config.forward)
  }

  if (config.balance) {
    addBalance(proxy, config.balance)
  }

  addReplayServers(proxy, config.replay)
  addRoutes(proxy, config)

  proxy.listen(+config.port || PORT)

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

    if (route.balance) {
      addBalance(proxy, route.balance)
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

function addBalance(proxy, urls) {
  if (typeof urls === 'string') {
    urls = urls.split(',')
  }
  proxy.balance(urls)
}

function isValidMethod(method) {
  return !!~['get', 'post', 'put', 'delete', 'patch', 'options', 'all'].indexOf(method)
}
