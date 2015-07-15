const rocky         = require('..')
const isPlainObject = require('lodash').isPlainObject

const defaultPort  = 3000
const reservedKeys = ['forward', 'replay', 'target']

module.exports = function (config) {
  if (!isPlainObject(config)) {
    throw new TypeError('config argument is required')
  }
  return createProxy(config)
}

function createProxy(config) {
  const proxy = rocky(config)

  if (config.forward) {
    proxy.forward(config.forward)
  }

  if (config.balance) {
    addBalanceServers(proxy, config.balance)
  }

  addReplayServers(proxy, config.replay)
  registerRoutes(proxy, config)

  const port = +config.port || defaultPort
  proxy.listen(port)

  return proxy
}

function registerRoutes(proxy, config) {
  var routes = Object.keys(config)
  .filter(function (key) {
    return !~reservedKeys.indexOf(key)
  })
  .map(function (path) {
    var route = config[path]
    if (route) route.path = path
    return route
  })
  .filter(isPlainObject)
  .filter(function (route) {
    return isValidMethod(route.method)
  })
  .forEach(function (route) {
    var path = route.path
    var method = route.method
    var router = proxy.route(method, path)

    if (route.forward) {
      router.forward(route.forward)
    }

    if (route.balance) {
      addBalance(proxy, route.balance)
    }

    addReplayServers(router, route.replay)
  })
}

function addReplayServers(proxy, replays) {
  if (typeof replays === 'string') {
    replays = [ replays ]
  }

  if (!Array.isArray(replays)) { return }

  replays.map(function (replay) {
    return typeof replay === 'string' ? { target: replay } : replay
  })
  .filter(isPlainObject)
  .forEach(function (replay) {
    proxy.replay(replay)
  })
}

function addBalanceServers(proxy, urls) {
  if (typeof urls === 'string') {
    urls = urls.split(',').map(function (url) {
      return url.trim()
    })
  }
  proxy.balance(urls)
}

function isValidMethod(method) {
  method = (method || 'all').toLowerCase()
  return !!~['get', 'post', 'put', 'delete', 'patch', 'options', 'all', 'head'].indexOf(method)
}
