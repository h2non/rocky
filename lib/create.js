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
      && _.isPlainObject(config[key])
  })
  .forEach(function (key) {
    var route = config[key]
    var method = (route.method || 'all').toLowerCase()
    var router = proxy.route(key, method)

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
